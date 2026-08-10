"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useChartStable } from "./chart-context";
import { Grid } from "./grid";

interface PriceAxisLabelsProps {
  ticks: number[];
  currency: string;
}

interface PriceScaleProps {
  currency: string;
  tickCount: number;
}

export function PriceAxisLabels({ ticks, currency }: PriceAxisLabelsProps) {
  const { containerRef, margin, yScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  const formatAxisPrice = (value: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return createPortal(
    <div className="chart-y-axis" aria-hidden="true">
      {ticks.map((tick) => (
        <span key={tick} style={{ top: margin.top + yScale(tick) }}>{formatAxisPrice(tick)}</span>
      ))}
    </div>,
    container,
  );
}

export function PriceScale({ currency, tickCount }: PriceScaleProps) {
  const { yScale } = useChartStable();
  const ticks = yScale.ticks(tickCount);

  return (
    <>
      <Grid
        fadeHorizontal={false}
        horizontal
        rowTickValues={ticks}
        stroke="rgba(237, 242, 233, .14)"
        strokeDasharray="4,6"
      />
      <PriceAxisLabels currency={currency} ticks={ticks} />
    </>
  );
}
