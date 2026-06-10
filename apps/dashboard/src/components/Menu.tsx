import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * Material 3 Overflow (⋮) menüsü — tam erişilebilir.
 * aria-haspopup/expanded · role=menu/menuitem · klavye (↑↓ Enter Esc) ·
 * dışarı-tıkla kapat · açılışta menüye, kapanışta tetikleyiciye odak.
 */
export function Menu({
  label,
  items,
  triggerLabel = "Daha fazla işlem",
}: {
  label: string;
  items: MenuItem[];
  triggerLabel?: string;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const onDocClick = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  function close(returnFocus = true): void {
    setOpen(false);
    if (returnFocus) btnRef.current?.focus();
  }

  function onKey(e: React.KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    }
  }

  return (
    <div className="m3-menu" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="m3-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={triggerLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        ⋮
      </button>
      {open ? (
        // ARIA menü: container role=menu + doğrudan role=menuitem butonlar (ul/li gerekmez).
        <div className="m3-menu-list" id={id} role="menu" aria-label={label} onKeyDown={onKey}>
          {items.map((it, i) => (
            <button
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              key={it.label}
              type="button"
              role="menuitem"
              tabIndex={i === active ? 0 : -1}
              className={`m3-menu-item${it.danger ? " danger" : ""}`}
              onClick={() => {
                it.onSelect();
                close();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
