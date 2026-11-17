import { merchantDeliveryAverages } from "@/lib/furnishing-plan";

const dayNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function DeliveryHistory({ merchant }: { merchant: string }) {
  const averages = merchantDeliveryAverages(merchant);
  return <div className="delivery-history">
    <dt>Merchant average delivery · Sample data</dt>
    {averages.length ? averages.map(({ label, count, days }) => <dd key={label}>
      <strong>{label}</strong> {dayNumber.format(days)} business days <span>({count} {count === 1 ? "report" : "reports"})</span>
    </dd>) : <dd>No sample arrivals yet</dd>}
  </div>;
}
