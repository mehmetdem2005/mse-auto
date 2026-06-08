/** Olaya göre bildirim/alarm metni (ekranda gösterilen). "X gerçekleşti" + açıklama. */
export interface AlertText {
  title: string;
  body: string;
}

export function composeEventAlert(input: {
  canonicalQuery: string;
  description: string;
}): AlertText {
  const subject = input.canonicalQuery.trim();
  const short = subject.length > 48 ? `${subject.slice(0, 47)}…` : subject;
  const body = input.description.trim();
  return {
    title: `🔔 ${short} — gerçekleşti`,
    body: body.length > 0 ? body : "İzlediğin olay gerçekleşti.",
  };
}
