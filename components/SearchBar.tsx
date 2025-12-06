"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 bg-gray-100 border-gray-300 focus:bg-white"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </form>
  );
}
