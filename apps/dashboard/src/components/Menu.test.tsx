import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Menu } from "./Menu";

describe("Menu (M3 overflow — a11y/klavye)", () => {
  it("açılır, aria-expanded değişir, menuitem seçilir ve kapanır", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menu label="Hesap" items={[{ label: "Çıkış", onSelect }]} />);

    const trigger = screen.getByRole("button", { name: "Daha fazla işlem" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu", { name: "Hesap" })).toBeTruthy();

    await user.click(screen.getByRole("menuitem", { name: "Çıkış" }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape menüyü kapatır", async () => {
    const user = userEvent.setup();
    render(<Menu label="X" items={[{ label: "A", onSelect: () => undefined }]} />);
    const trigger = screen.getByRole("button", { name: "Daha fazla işlem" });
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
