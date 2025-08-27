import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert";
import { test } from "node:test";
import MyLinks, { splitLinks, LinkItem } from "./my-links";

function createLinks(count: number): LinkItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    label: `Link ${i}`,
    url: `https://example.com/${i}`,
    icon: <span />, // simple placeholder
  }));
}

test("splitLinks respects limit 5", () => {
  const links = createLinks(8);
  const { visible, overflow } = splitLinks(links, 5);
  assert.strictEqual(visible.length, 5);
  assert.strictEqual(overflow.length, 3);
});

test("splitLinks respects limit 11", () => {
  const links = createLinks(11);
  const { visible, overflow } = splitLinks(links, 11);
  assert.strictEqual(visible.length, 11);
  assert.strictEqual(overflow.length, 0);
});

test("renders 11 tiles with no overflow menu", () => {
  const links = createLinks(11);
  const html = renderToStaticMarkup(<MyLinks links={links} maxVisibleTiles={11} />);
  assert.ok(!html.includes("+"));
});

test("renders ellipsis tile for 12 links", () => {
  const links = createLinks(12);
  const html = renderToStaticMarkup(<MyLinks links={links} maxVisibleTiles={11} />);
  assert.ok(html.includes("+1"));
});

test("renders correct overflow count for more than 12 links", () => {
  const links = createLinks(15);
  const html = renderToStaticMarkup(<MyLinks links={links} maxVisibleTiles={11} />);
  assert.ok(html.includes("+4"));
});

