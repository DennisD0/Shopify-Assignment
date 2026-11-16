import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const button = cva("button", { variants: { variant: { primary: "primary", outline: "outline", ghost: "ghost" } }, defaultVariants: { variant: "primary" } });
export function Button({ variant, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>) {
  return <button type="button" className={twMerge(clsx(button({ variant }), className))} {...props} />;
}

export function Panel({ title, description, onClose, children, drawer = false }: {
  title: string; description: string; onClose: () => void; children: ReactNode; drawer?: boolean;
}) {
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="panel-overlay" />
      <Dialog.Content className={drawer ? "panel drawer" : "panel"}>
        <div className="panel-heading">
          <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
          <Dialog.Close asChild><button className="icon-button" aria-label="Close panel"><X size={20} /></button></Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
