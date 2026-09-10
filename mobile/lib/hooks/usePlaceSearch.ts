import { useState, useEffect, useRef, useCallback } from "react";
import { searchPlaces, PlaceSearchResult } from "@/lib/api/geocoding";

export function usePlaceSearch(
    userLocation?: { latitude: number; longitude: number } | null,
) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PlaceSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback(
        (text: string) => {
            setQuery(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();

            if (text.trim().length < 2) {
                setResults([]);
                return;
            }

            debounceRef.current = setTimeout(async () => {
                const controller = new AbortController();
                abortRef.current = controller;
                setLoading(true);
                try {
                    const res = await searchPlaces(
                        text,
                        userLocation,
                        controller.signal,
                    );
                    if (!controller.signal.aborted) setResults(res);
                } catch (e: any) {
                    if (e.name !== "AbortError") console.warn(e);
                } finally {
                    if (!controller.signal.aborted) setLoading(false);
                }
            }, 350);
        },
        [userLocation],
    );

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
        },
        [],
    );

    return { query, results, loading, search };
}
