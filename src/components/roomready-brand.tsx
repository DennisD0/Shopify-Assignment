import Link from "next/link";

export function RoomReadyBrand({ rail = false }: { rail?: boolean }) {
  return <Link className={rail ? "brand rail-brand" : "brand"} href="/" aria-label="RoomReady">
    <img className="brand-mark" src="/roomready-mark.svg" width={40} height={40} alt="" />
    <span className="brand-wordmark">RoomReady</span>
  </Link>;
}
