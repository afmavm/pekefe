export interface AcademyCourse {
  id: string;
  title: string;
  category: "geleneksel lezzetler" | "Gastronomi" | "Sürdürülebilir Tarım";
  instructor: string;
  duration: string;
  lessonsCount: number;
  level: "Başlangıç" | "Orta Seviye" | "Ustalık Sınıfı";
  image: string;
  description: string;
  modules: string[];
  isFeatured?: boolean;
}

export interface CourseEnrollmentRequest {
  courseId: string;
  fullName: string;
  email: string;
  phone: string;
  occupation?: string;
}
