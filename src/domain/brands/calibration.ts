export function isCalibrationBrand(brand: { name: string; description?: string | null }): boolean {
  const text = `${brand.name}${brand.description ?? ""}`;
  return /澜序女装/.test(brand.name) || /虚构/.test(text);
}
