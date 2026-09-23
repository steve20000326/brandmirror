/** Format a date for Chinese locale display. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Map brand status codes to readable Chinese labels. */
export function brandStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "准备测试",
    ready: "准备测试",
    scanning: "测试中",
    completed: "已完成",
  };
  return map[status] ?? status;
}

/** Join non-empty class names. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
