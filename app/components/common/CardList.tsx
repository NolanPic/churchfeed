"use client";

import { ReactNode, useRef, useEffect } from "react";
import { Card, CardHeader, CardBody } from "./Card";
import styles from "./CardList.module.css";

export interface CardListProps<T> {
  data: T[];
  status: "LoadingFirstPage" | "CanLoadMore" | "Exhausted";
  loadMore?: (numItems: number) => void;
  renderCardHeader?: (item: T) => ReactNode;
  renderCardBody: (item: T) => ReactNode;
  className?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function CardList<T extends { _id?: string }>({
  data,
  status,
  loadMore,
  renderCardHeader,
  renderCardBody,
  className = "",
  emptyMessage = "No data",
  itemsPerPage = 10,
}: CardListProps<T>) {
  const endOfList = useRef<HTMLDivElement>(null);
  const intersectionCb = useRef<IntersectionObserverCallback | null>(null);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && status === "CanLoadMore" && loadMore) {
      loadMore(itemsPerPage);
    }
  };

  useEffect(() => {
    intersectionCb.current = handleIntersection;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        intersectionCb.current?.(entries, observer);
      },
      {
        rootMargin: "200px",
      }
    );
    if (endOfList.current) {
      observer.observe(endOfList.current);
    }
    return () => observer.disconnect();
  }, []);

  // Loading state
  if (status === "LoadingFirstPage") {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Empty state
  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.cardListWrapper}>
      <div className={className || styles.cardList}>
        {data.map((item, index) => (
          <Card key={item._id || index}>
            {renderCardHeader && <CardHeader>{renderCardHeader(item)}</CardHeader>}
            <CardBody>{renderCardBody(item)}</CardBody>
          </Card>
        ))}
      </div>
      <div ref={endOfList} />
    </div>
  );
}

export default CardList;
