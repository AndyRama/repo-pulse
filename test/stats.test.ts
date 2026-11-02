import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysBetween, median, percentile, ratio, round, scale } from "../src/stats.js";

describe("stats", () => {
  it("computes the median of odd and even sets", () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 3, 2]), 2.5);
  });

  it("returns null for empty input", () => {
    assert.equal(median([]), null);
    assert.equal(percentile([], 90), null);
  });

  it("handles a single value", () => {
    assert.equal(percentile([7], 90), 7);
  });

  it("interpolates percentiles", () => {
    assert.equal(percentile([1, 2, 3, 4, 5], 0), 1);
    assert.equal(percentile([1, 2, 3, 4, 5], 100), 5);
    assert.equal(percentile([10, 20], 50), 15);
  });

  it("does not mutate its input", () => {
    const values = [3, 1, 2];
    median(values);
    assert.deepEqual(values, [3, 1, 2]);
  });

  it("rejects out-of-range percentiles", () => {
    assert.throws(() => percentile([1], 101), RangeError);
    assert.throws(() => percentile([1], -1), RangeError);
  });

  it("computes day differences", () => {
    assert.equal(daysBetween("2026-01-01T00:00:00Z", "2026-01-03T12:00:00Z"), 2.5);
  });

  it("returns null ratio on a zero denominator", () => {
    assert.equal(ratio(1, 0), null);
    assert.equal(ratio(1, 4), 0.25);
  });

  it("scales values between best and worst", () => {
    assert.equal(scale(3, 3, 30), 1);
    assert.equal(scale(30, 3, 30), 0);
    assert.equal(scale(100, 3, 30), 0);
    assert.equal(scale(1, 3, 30), 1);
    assert.equal(scale(16.5, 3, 30), 0.5);
    assert.equal(scale(0.25, 0, 0.5), 0.5);
  });

  it("rounds to the requested digits", () => {
    assert.equal(round(1.2345, 2), 1.23);
    assert.equal(round(72.6, 0), 73);
  });
});
