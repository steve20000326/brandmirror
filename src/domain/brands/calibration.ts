export function isCalibrationBrand(brand: {
  name: string;
  isCalibration?: boolean;
  description?: string | null;
}): boolean {
  if (brand.isCalibration) return true;
  const text = `${brand.name}${brand.description ?? ""}`;
  return /澜序女装/.test(brand.name) || /虚构/.test(text);
}
