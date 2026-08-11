export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatTurkishCurrency(val: any): string {
  if (val === null || val === undefined || val === "") return "";
  
  if (typeof val === "number") {
    return val.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  let str = String(val);

  // Clean characters: keep only digits, commas, and dots
  str = str.replace(/[^0-9,\.]/g, "");

  // If there is no comma, but there is a dot, check if we should convert the last dot to a comma
  if (!str.includes(",")) {
    const lastDotIndex = str.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      const afterDot = str.substring(lastDotIndex + 1);
      // If the last dot is followed by 0, 1, or 2 digits, it's a decimal separator
      if (afterDot.length <= 2) {
        str = str.substring(0, lastDotIndex) + "," + afterDot;
      }
    }
  }

  // Now split by the first comma (if any)
  const parts = str.split(",");
  let integerPart = parts[0] || "";
  let decimalPart = parts.length > 1 ? parts[1] : null;

  // Clean all dots from the integer part
  integerPart = integerPart.replace(/\./g, "").replace(/\D/g, "");

  // Format integer part with thousands separators
  if (integerPart) {
    const num = parseInt(integerPart, 10);
    integerPart = num.toLocaleString("tr-TR");
  } else if (decimalPart !== null) {
    integerPart = "0";
  }

  if (decimalPart !== null) {
    // Clean non-digits and limit to 2 digits
    decimalPart = decimalPart.replace(/\D/g, "").substring(0, 2);
    return `${integerPart},${decimalPart}`;
  }

  return integerPart;
}

export function parseTurkishCurrency(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Remove thousands separators (.) and replace decimal separator (,) with period (.)
  const clean = String(val).replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatTurkishPhone(val: string): string {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  // Strip leading zero if typed
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  digits = digits.substring(0, 10); // limit to 10 digits
  
  if (digits.length === 0) return "";
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
  }
  if (digits.length <= 8) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }
  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8)}`;
}

export function formatTurkishDate(val: string): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "").substring(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.substring(0, 2)}.${digits.substring(2)}`;
  }
  return `${digits.substring(0, 2)}.${digits.substring(2, 4)}.${digits.substring(4)}`;
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')     // Clean remaining non-alphanumeric
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const logoFiles = [
  "Logo.jpg",
  "1779016776947-365377533-Logo.jpg",
  "1779836095322-585290292-Logo.jpg",
  "1782089456145-zv5143ue6.jpg",
  "1782255313244-2htzyv7ae.jpg",
  "1782678055703-rxrd8ozbn.jpg",
  "1782771313524-51cs7qjdj.jpg"
];

export function isLogoImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase();
  return logoFiles.some(logo => cleanUrl.includes(logo.toLowerCase())) || cleanUrl.includes("logo");
}

export function normalizeImagePath(path?: any): string {
  if (typeof path !== "string") return "";
  let clean = path.trim();
  
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  
  if (clean.startsWith("public/")) {
    clean = clean.replace("public/", "");
  } else if (clean.startsWith("/public/")) {
    clean = clean.replace("/public/", "");
  }
  
  if (!clean.startsWith("/")) {
    clean = "/" + clean;
  }
  
  return clean;
}

export interface ProductMediaObject {
  id?: string;
  type: "image" | "video";
  url: string;
  name?: string;
}

export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.toLowerCase().trim();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".ogg") ||
    clean.includes("youtube.com") ||
    clean.includes("youtu.be") ||
    clean.includes("vimeo.com")
  );
}

export function resolveProductImage(image: any, images: any): string {
  let mainImage = typeof image === "string" ? image.trim() : "";
  
  let imagesList: any[] = [];
  if (images) {
    try {
      const parsed = typeof images === "string" ? JSON.parse(images) : images;
      if (Array.isArray(parsed)) {
        imagesList = parsed;
      }
    } catch (e) {
      console.error("Failed to parse images JSON in resolveProductImage:", e);
    }
  }

  const getStringUrl = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object" && item.url) return item.url;
    return "";
  };

  // 1. Durum: Ana görsel boşsa galerideki ilk logo ve video olmayan resmi seç
  if (!mainImage && imagesList.length > 0) {
    const found = imagesList.find(item => {
      const u = getStringUrl(item);
      return u && !isLogoImage(u) && !isVideoUrl(u);
    });
    if (found) mainImage = getStringUrl(found);
    else mainImage = getStringUrl(imagesList[0]);
  }

  // 2. Durum: Ana görsel logoysa galerideki logo olmayan görseli seç
  if (isLogoImage(mainImage) && imagesList.length > 0) {
    const nonLogo = imagesList.find(item => {
      const u = getStringUrl(item);
      return u && !isLogoImage(u);
    });
    if (nonLogo) {
      mainImage = getStringUrl(nonLogo);
    }
  }

  return normalizeImagePath(mainImage);
}

export function resolveProductMediaItems(image: any, images: any, videoUrl?: string | null): ProductMediaObject[] {
  const result: ProductMediaObject[] = [];
  const addedUrls = new Set<string>();

  const processItem = (item: any) => {
    if (!item) return;
    let url = "";
    let type: "image" | "video" = "image";
    let name = "";

    if (typeof item === "string") {
      url = item.trim();
      type = isVideoUrl(url) ? "video" : "image";
      name = type === "video" ? "Ürün_Videosu.mp4" : "Görsel.jpg";
    } else if (typeof item === "object" && item.url) {
      url = String(item.url).trim();
      type = item.type === "video" || isVideoUrl(url) ? "video" : "image";
      name = item.name || (type === "video" ? "Ürün_Videosu.mp4" : "Görsel.jpg");
    }

    if (!url || isLogoImage(url) || addedUrls.has(url)) return;
    addedUrls.add(url);
    result.push({ id: Math.random().toString(), type, url: normalizeImagePath(url), name });
  };

  // 1. Process images field array
  if (images) {
    try {
      const parsed = typeof images === "string" ? JSON.parse(images) : images;
      if (Array.isArray(parsed)) {
        parsed.forEach(processItem);
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Process primary image field
  if (typeof image === "string" && image.trim()) {
    processItem(image);
  }

  // 3. Process videoUrl field if present
  if (videoUrl && typeof videoUrl === "string" && videoUrl.trim()) {
    processItem({ type: "video", url: videoUrl, name: "Tanıtım_Videosu.mp4" });
  }

  return result;
}

export function resolveProductGallery(image: string | null | undefined, images: any): string[] {
  const mediaItems = resolveProductMediaItems(image, images);
  return mediaItems.map(m => m.url);
}

