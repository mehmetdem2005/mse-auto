import Assistant from "@/components/Assistant";
export const dynamic = "force-dynamic";

export default function AsistanPage() {
  return (
    <>
      <div className="eyebrow">Konuşulabilir AI</div>
      <h1>Asistan</h1>
      <p className="sub">Pipeline'ı sohbetle yönet: emir ver, panel açtır, durum sor. Asistan arka planı izler, onay gerekeni söyler ve öneri sunar.</p>
      <Assistant />
    </>
  );
}
