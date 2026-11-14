import test from "node:test";
import assert from "node:assert/strict";
import {
  addItem, setItemQuantity, removeItem, cartCount, cartSubtotal, parseStoredCart, MAX_LINE_QUANTITY
} from "../lib/cart.ts";
import { validateCheckoutForm, normalizePhone } from "../lib/checkout-validation.ts";

const dock = { productId: "a", name: "Dock", price: 299, image: "", live: true };

test("addItem adds a new line, then increments it", () => {
  let items = addItem([], dock);
  assert.equal(items.length, 1);
  items = addItem(items, dock);
  assert.equal(items[0].quantity, 2);
});

test("addItem never exceeds the per-order limit or available stock", () => {
  let items = [];
  for (let i = 0; i < 25; i++) items = addItem(items, dock);
  assert.equal(items[0].quantity, MAX_LINE_QUANTITY);

  let limited = [];
  for (let i = 0; i < 5; i++) limited = addItem(limited, { ...dock, productId: "b", stock: 2 });
  assert.equal(limited[0].quantity, 2);
});

test("addItem ignores out-of-stock products", () => {
  assert.deepEqual(addItem([], { ...dock, stock: 0 }), []);
});

test("setItemQuantity updates, clamps and removes", () => {
  const items = addItem([], dock);
  assert.equal(setItemQuantity(items, "a", 4)[0].quantity, 4);
  assert.equal(setItemQuantity(items, "a", 99)[0].quantity, MAX_LINE_QUANTITY);
  assert.equal(setItemQuantity(items, "a", 0).length, 0);
  assert.equal(setItemQuantity(items, "a", Number.NaN).length, 0);
});

test("removeItem, count and subtotal", () => {
  let items = addItem([], dock);
  items = addItem(items, dock);
  items = addItem(items, { ...dock, productId: "c", price: 100 });
  assert.equal(cartCount(items), 3);
  assert.equal(cartSubtotal(items), 299 * 2 + 100);
  assert.equal(removeItem(items, "a").length, 1);
});

test("parseStoredCart drops malformed data", () => {
  assert.deepEqual(parseStoredCart(null), []);
  assert.deepEqual(parseStoredCart("not json"), []);
  assert.deepEqual(parseStoredCart('{"a":1}'), []);
  const raw = JSON.stringify([
    { productId: "a", quantity: 2, price: 10, name: "Ok", image: "", live: true },
    { productId: "a", quantity: 1, price: 10 },
    { productId: "b", quantity: 0, price: 10 },
    { productId: "c", quantity: 1, price: -5 },
    { productId: "d", quantity: 1.5, price: 10 },
    { quantity: 1, price: 10 },
    null
  ]);
  const items = parseStoredCart(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].productId, "a");
  assert.equal(parseStoredCart(JSON.stringify([{ productId: "z", quantity: 500, price: 1 }]))[0].quantity, MAX_LINE_QUANTITY);
});

const valid = { name: "Thabo Mokoena", phone: "082 555 1234", email: "", address: "12 Church Street", city: "Pretoria", province: "Gauteng", zip: "0002" };

test("a valid South African checkout form passes and is cleaned", () => {
  const result = validateCheckoutForm(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.phone, "0825551234");
  assert.equal(result.value.email, undefined);
});

test("phone numbers: accepts local and +27, rejects junk", () => {
  assert.equal(normalizePhone("(082) 555-1234"), "0825551234");
  assert.equal(validateCheckoutForm({ ...valid, phone: "+27 82 555 1234" }).ok, true);
  assert.equal(validateCheckoutForm({ ...valid, phone: "abc" }).ok, false);
  assert.equal(validateCheckoutForm({ ...valid, phone: "12345" }).ok, false);
});

test("postal code must be 4 digits, province must be real, email must look valid", () => {
  assert.equal(validateCheckoutForm({ ...valid, zip: "123" }).ok, false);
  assert.equal(validateCheckoutForm({ ...valid, zip: "12345" }).ok, false);
  assert.equal(validateCheckoutForm({ ...valid, province: "Atlantis" }).ok, false);
  assert.equal(validateCheckoutForm({ ...valid, email: "not-an-email" }).ok, false);
  assert.equal(validateCheckoutForm({ ...valid, email: "thabo@example.co.za" }).ok, true);
});

test("missing fields are reported per field", () => {
  const result = validateCheckoutForm({});
  assert.equal(result.ok, false);
  for (const field of ["name", "phone", "address", "city", "zip"]) assert.ok(result.errors[field], field);
});
