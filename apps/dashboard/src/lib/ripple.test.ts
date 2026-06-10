import { afterEach, describe, expect, it } from "vitest";
import { installRipple } from "./ripple";

// jsdom'da PointerEvent yok → "pointerdown" tipli MouseEvent ile tetikle (clientX/Y taşır).
function pointerDown(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
}

describe("installRipple (Material ripple)", () => {
  const made: HTMLElement[] = [];
  afterEach(() => {
    for (const el of made) el.remove();
    made.length = 0;
  });
  function add(cls: string): HTMLElement {
    const el = document.createElement("button");
    el.className = cls;
    document.body.appendChild(el);
    made.push(el);
    return el;
  }

  it("eşleşen yüzeyde (.btn) ripple span ekler", () => {
    const btn = add("btn");
    const cleanup = installRipple();
    pointerDown(btn);
    expect(btn.querySelector(".ripple-ink")).not.toBeNull();
    cleanup();
  });

  it("eşleşmeyen öğeye eklemez; disabled atlanır", () => {
    const plain = add("xyz");
    const dis = add("btn");
    dis.setAttribute("disabled", "");
    const cleanup = installRipple();
    pointerDown(plain);
    pointerDown(dis);
    expect(plain.querySelector(".ripple-ink")).toBeNull();
    expect(dis.querySelector(".ripple-ink")).toBeNull();
    cleanup();
  });
});
