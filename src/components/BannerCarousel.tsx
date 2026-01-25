import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
    id: string;
    title: string;
    desktop_image_url: string;
    mobile_image_url: string | null;
    link_url: string | null;
    order_index: number;
    is_active: boolean;
}

export const BannerCarousel = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchBanners();
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };

    const fetchBanners = async () => {
        try {
            const { data, error } = await supabase
                .from("banners" as any)
                .select("*")
                .eq("is_active", true)
                .order("order_index", { ascending: true });

            if (error) throw error;
            setBanners((data as unknown as Banner[]) || []);
        } catch (error) {
            console.error("Erro ao carregar banners:", error);
        } finally {
            setLoading(false);
        }
    };

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }, [banners.length]);

    // Auto-advance slides every 5 seconds
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [banners.length, nextSlide]);

    if (loading || banners.length === 0) {
        return null;
    }

    const currentBanner = banners[currentIndex];
    const imageUrl = isMobile && currentBanner.mobile_image_url
        ? currentBanner.mobile_image_url
        : currentBanner.desktop_image_url;

    const BannerContent = (
        <div className="relative w-full overflow-hidden rounded-xl group">
            <img
                src={imageUrl}
                alt={currentBanner.title}
                className="w-full h-auto object-cover transition-transform duration-500"
                style={{ maxHeight: isMobile ? "180px" : "280px" }}
            />

            {/* Navigation arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                        aria-label="Banner anterior"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                        aria-label="Proximo banner"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}

            {/* Dots indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? "bg-white w-6"
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                            aria-label={`Ir para banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    // Wrap in link if banner has a URL
    if (currentBanner.link_url) {
        return (
            <a
                href={currentBanner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-6"
            >
                {BannerContent}
            </a>
        );
    }

    return <div className="mb-6">{BannerContent}</div>;
};

export default BannerCarousel;
