import { expect, test } from "bun:test";

process.env.DATABASE_PATH = ":memory:";
const { saveSignup } = await import("../src/store");

test("an invalid email is rejected", () => {
  for (const email of ["", "jo", "jo@", "@example.com", "jo@example", "jo smith@example.com"])
    expect(saveSignup(email, "example.com", "consent")).toBe("invalid");
});

test("an email and domain pair is stored once", () => {
  expect(saveSignup("jo@example.com", "example.com", "consent")).toBe("saved");
  expect(saveSignup("jo@example.com", "example.com", "consent")).toBe("duplicate");
  expect(saveSignup("jo@example.com", "other.com", "consent")).toBe("saved");
});
