"use client";

import Link from "next/link";
import { useLoading } from "@/components/LoadingProvider";

type DocumentLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export function DocumentLink({ href, className, children }: DocumentLinkProps) {
  const { showLoading } = useLoading();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        showLoading("Opening document…");
      }}
    >
      {children}
    </Link>
  );
}
