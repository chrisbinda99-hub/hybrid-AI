import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GpuStatusInfo } from '../types';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface VramUsageChartD3Props {
  gpuStatus: GpuStatusInfo;
  activeModelName: string;
  onSelectModel?: (modelName: string) => void;
  thresholdGb?: number;
}

type ChartViewMode = 'breakdown' | 'comparison' | 'timeline';

interface TimelinePoint {
  time: Date;
  dwmGb: number;
  modelGb: number;
  kvGb: number;
  totalGb: number;
}

export const VramUsageChartD3: React.FC<VramUsageChartD3Props> = ({
  gpuStatus,
  activeModelName,
  onSelectModel,
  thresholdGb,
}) => {
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('breakdown');
  const [hoveredSlice, setHoveredSlice] = useState<{
    title: string;
    valueGb: number;
    percent: number;
    color: string;
    description: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(640);

  // Maintain real-time timeline data points
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>(() => {
    const now = Date.now();
    const baseDwm = gpuStatus.breakdown.windows11DwmGb;
    const baseModel = gpuStatus.breakdown.modelVramGb;
    const baseKv = gpuStatus.breakdown.kvCacheGb;

    return Array.from({ length: 20 }).map((_, i) => {
      const t = new Date(now - (19 - i) * 2000);
      const jitter = (Math.sin(i * 0.7) * 0.15);
      const mGb = Math.max(0.5, baseModel + jitter);
      return {
        time: t,
        dwmGb: baseDwm,
        modelGb: mGb,
        kvGb: baseKv,
        totalGb: baseDwm + mGb + baseKv,
      };
    });
  });

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(Math.floor(entries[0].contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update timeline on status changes or interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const baseDwm = gpuStatus.breakdown.windows11DwmGb;
      const baseModel = gpuStatus.breakdown.modelVramGb;
      const baseKv = gpuStatus.breakdown.kvCacheGb;
      const randomFluctuation = (Math.random() - 0.5) * 0.2;
      const mGb = Math.max(0.4, baseModel + randomFluctuation);

      setTimelineData((prev) => {
        const next = [
          ...prev.slice(1),
          {
            time: now,
            dwmGb: baseDwm,
            modelGb: mGb,
            kvGb: baseKv,
            totalGb: Number((baseDwm + mGb + baseKv).toFixed(2)),
          },
        ];
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [gpuStatus]);

  // Main D3 Rendering logic depending on viewMode
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerWidth || 640;
    const height = 280;

    if (viewMode === 'breakdown') {
      renderBreakdownDonutChart(svg, width, height);
    } else if (viewMode === 'comparison') {
      renderModelComparisonChart(svg, width, height);
    } else if (viewMode === 'timeline') {
      renderTimelineAreaChart(svg, width, height);
    }
  }, [viewMode, gpuStatus, containerWidth, timelineData, thresholdGb]);

  // -------------------------------------------------------------
  // 1. D3 RENDERER: VRAM BREAKDOWN DONUT & RADIAL METRIC
  // -------------------------------------------------------------
  const renderBreakdownDonutChart = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const margin = { top: 15, right: width > 520 ? 180 : 15, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Center of donut
    const centerX = width > 520 ? chartWidth / 2 + margin.left : width / 2;
    const centerY = height / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 10;
    const innerRadius = radius * 0.62;

    const slices = [
      {
        id: 'dwm',
        label: 'Windows 11 DWM',
        value: gpuStatus.breakdown.windows11DwmGb,
        color: '#6366f1', // Indigo
        description: 'Desktop Window Manager, GPU-Compositing und Windows 11 Fluent UI',
      },
      {
        id: 'model',
        label: `Ollama (${gpuStatus.activeModel.name})`,
        value: gpuStatus.breakdown.modelVramGb,
        color:
          gpuStatus.vramPercent >= 90
            ? '#f43f5e' // Rose
            : gpuStatus.vramPercent >= 75
            ? '#f59e0b' // Amber
            : '#06b6d4', // Cyan
        description: `Modell-Gewichte (${gpuStatus.activeModel.quantization}) im VRAM geladen (${gpuStatus.activeModel.gpuOffloadPercent}% Offload)`,
      },
      {
        id: 'kv',
        label: 'KV-Cache Kontext-Puffer',
        value: gpuStatus.breakdown.kvCacheGb,
        color: '#eab308', // Yellow
        description: 'Dynamischer Key-Value Cache für Multi-Turn Chat-Historie',
      },
      {
        id: 'free',
        label: 'Freier GPU-VRAM',
        value: Math.max(0.1, gpuStatus.breakdown.freeGb),
        color: '#1e293b', // Slate-800
        description: 'Verfügbarer Grafikspeicher für weitere Layer oder größere Kontexte',
      },
    ];

    const g = svg.append('g');

    // Define gradients for glow & depth
    const defs = svg.append('defs');

    // Drop shadow filter
    const filter = defs.append('filter').attr('id', 'd3-vram-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const pie = d3
      .pie<(typeof slices)[0]>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.025);

    const arcGenerator = d3
      .arc<d3.PieArcDatum<(typeof slices)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<(typeof slices)[0]>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 7)
      .cornerRadius(6);

    const arcs = g
      .append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .selectAll('.arc')
      .data(pie(slices))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    arcs
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#090d16')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', () => arcHover(d))
          .attr('filter', 'url(#d3-vram-glow)');

        setHoveredSlice({
          title: d.data.label,
          valueGb: d.data.value,
          percent: Math.round((d.data.value / gpuStatus.totalVramGb) * 100),
          color: d.data.color,
          description: d.data.description,
        });
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', () => arcGenerator(d))
          .attr('filter', null);

        setHoveredSlice(null);
      });

    // Center texts inside donut hole
    const centerGroup = g
      .append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    centerGroup
      .append('text')
      .attr('dy', '-0.4em')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#f8fafc')
      .attr('letter-spacing', '-0.02em')
      .text(`${gpuStatus.vramPercent}%`);

    centerGroup
      .append('text')
      .attr('dy', '1em')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr(
        'fill',
        gpuStatus.vramPercent >= 90
          ? '#f43f5e'
          : gpuStatus.vramPercent >= 75
          ? '#f59e0b'
          : '#34d399'
      )
      .text(
        gpuStatus.vramPercent >= 90
          ? 'OOM GEFAHR'
          : gpuStatus.vramPercent >= 75
          ? 'HOHE LAST'
          : 'OPTIMAL'
      );

    centerGroup
      .append('text')
      .attr('dy', '2.5em')
      .attr('font-size', '9.5px')
      .attr('fill', '#94a3b8')
      .text(`${gpuStatus.usedVramGb.toFixed(1)} / ${gpuStatus.totalVramGb.toFixed(1)} GB`);

    // Legend on the right side if width allows
    if (width > 520) {
      const legendX = chartWidth + margin.left - 10;
      const legendY = 30;

      const legend = g
        .append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`);

      slices.forEach((s, idx) => {
        const item = legend.append('g').attr('transform', `translate(0, ${idx * 48})`);

        // Color rect
        item
          .append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('rx', 2)
          .attr('fill', s.color);

        // Label
        item
          .append('text')
          .attr('x', 16)
          .attr('y', 9)
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('fill', '#e2e8f0')
          .text(s.id === 'model' ? 'Ollama Modell' : s.label);

        // Subvalue
        const pct = Math.round((s.value / gpuStatus.totalVramGb) * 100);
        item
          .append('text')
          .attr('x', 16)
          .attr('y', 23)
          .attr('font-size', '10px')
          .attr('fill', '#94a3b8')
          .text(`${s.value.toFixed(1)} GB • ${pct}%`);
      });
    }
  };

  // -------------------------------------------------------------
  // 2. D3 RENDERER: HORIZONTAL BAR COMPARISON OF OLLAMA MODELS
  // -------------------------------------------------------------
  const renderModelComparisonChart = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const models = gpuStatus.testedModels || [
      { name: 'llama3.2:3b', paramSize: '3.2B', quant: 'Q4_K_M', vramRequiredGb: 2.2, compatibility: 'perfect', inferenceSpeedTokensSec: 48 },
      { name: 'phi3:mini', paramSize: '3.8B', quant: 'Q4_K_M', vramRequiredGb: 2.5, compatibility: 'perfect', inferenceSpeedTokensSec: 42 },
      { name: 'mistral:7b', paramSize: '7.2B', quant: 'Q4_K_M', vramRequiredGb: 4.8, compatibility: 'tight', inferenceSpeedTokensSec: 28 },
      { name: 'llama3:8b', paramSize: '8.0B', quant: 'Q4_K_M', vramRequiredGb: 5.6, compatibility: 'tight', inferenceSpeedTokensSec: 24 },
      { name: 'llama3:70b', paramSize: '70B', quant: 'Q4_K_M', vramRequiredGb: 39.0, compatibility: 'overload', inferenceSpeedTokensSec: 2 },
    ];

    // Total display cap on X axis (either totalVramGb * 1.35 or max model)
    const maxVram = Math.max(gpuStatus.totalVramGb * 1.25, 16);

    const margin = { top: 25, right: 60, bottom: 40, left: 110 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Y Scale: Models
    const yScale = d3
      .scaleBand()
      .domain(models.map((m) => m.name))
      .range([0, chartHeight])
      .padding(0.28);

    // X Scale: VRAM in GB
    const xScale = d3.scaleLinear().domain([0, maxVram]).range([0, chartWidth]);

    // Background gridlines
    const xAxisGrid = d3.axisBottom(xScale).ticks(5).tickSize(-chartHeight).tickFormat(() => '');
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .attr('class', 'grid')
      .call(xAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,2');

    // Threshold Line for User's Custom VRAM Warning Limit
    const effectiveThresh = thresholdGb ?? (gpuStatus.totalVramGb * 0.85);
    const threshX = xScale(effectiveThresh);
    if (threshX <= chartWidth) {
      const threshG = g.append('g').attr('transform', `translate(${threshX}, 0)`);

      threshG
        .append('line')
        .attr('y1', -10)
        .attr('y2', chartHeight)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3');

      threshG
        .append('text')
        .attr('y', -12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fbbf24')
        .text(`Kritische Schwelle: ${effectiveThresh.toFixed(1)} GB`);
    }

    // Threshold Line for User's Max GPU Limit
    const gpuLimitX = xScale(gpuStatus.totalVramGb);
    if (gpuLimitX <= chartWidth) {
      const limitG = g.append('g').attr('transform', `translate(${gpuLimitX}, 0)`);

      limitG
        .append('line')
        .attr('y1', -10)
        .attr('y2', chartHeight)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,3');

      limitG
        .append('text')
        .attr('y', -12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9.5px')
        .attr('font-weight', 'bold')
        .attr('fill', '#f87171')
        .text(`Max GPU Limit: ${gpuStatus.totalVramGb} GB`);
    }

    // Bars
    models.forEach((m) => {
      const yPos = yScale(m.name) || 0;
      const barHeight = yScale.bandwidth();
      // Total needed including Windows 11 DWM baseline
      const totalNeeded = Number((m.vramRequiredGb + gpuStatus.breakdown.windows11DwmGb).toFixed(1));
      const barWidth = Math.min(chartWidth, xScale(totalNeeded));
      const isCurrent = m.name === activeModelName;
      const isOverload = totalNeeded > gpuStatus.totalVramGb;
      const isTight = totalNeeded > gpuStatus.totalVramGb * 0.8 && !isOverload;

      const barColor = isOverload ? '#f43f5e' : isTight ? '#f59e0b' : '#06b6d4';

      const barGroup = g
        .append('g')
        .attr('class', 'model-bar')
        .style('cursor', 'pointer')
        .on('click', () => {
          if (onSelectModel) onSelectModel(m.name);
        });

      // Background bar track
      barGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', yPos)
        .attr('width', chartWidth)
        .attr('height', barHeight)
        .attr('fill', '#0f172a')
        .attr('rx', 4);

      // Active fill bar
      barGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', yPos)
        .attr('width', 0)
        .attr('height', barHeight)
        .attr('fill', barColor)
        .attr('rx', 4)
        .attr('opacity', isCurrent ? 1 : 0.85)
        .transition()
        .duration(500)
        .attr('width', barWidth);

      // Value label after bar
      barGroup
        .append('text')
        .attr('x', barWidth + 8)
        .attr('y', yPos + barHeight / 2 + 3.5)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', isOverload ? '#fca5a5' : '#cbd5e1')
        .text(`${totalNeeded} GB ${isOverload ? '(OOM)' : ''}`);

      // Model tokens/s indicator
      barGroup
        .append('text')
        .attr('x', Math.min(barWidth - 6, chartWidth - 10))
        .attr('y', yPos + barHeight / 2 + 3.5)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', '#090d16')
        .style('pointer-events', 'none')
        .text(barWidth > 60 ? `~${m.inferenceSpeedTokensSec} t/s` : '');
    });

    // Y Axis (Model Names)
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const yAxisG = g
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '10.5px')
      .attr('font-weight', (d) => (d === activeModelName ? 'bold' : 'normal'))
      .attr('fill', (d) => (d === activeModelName ? '#38bdf8' : '#94a3b8'))
      .attr('dx', '-6');

    // X Axis (GB values)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => `${d} GB`);

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '9.5px')
      .attr('fill', '#64748b');

    // Axis label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 32)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text('Benötigter Gesamtspeicher (Modell + DWM + KV-Cache in GB)');
  };

  // -------------------------------------------------------------
  // 3. D3 RENDERER: REAL-TIME VRAM USAGE TIMELINE & AREA STREAM
  // -------------------------------------------------------------
  const renderTimelineAreaChart = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const margin = { top: 25, right: 25, bottom: 35, left: 45 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'vram-area-gradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    const isHigh = gpuStatus.vramPercent >= 75;
    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isHigh ? '#f59e0b' : '#06b6d4')
      .attr('stop-opacity', 0.55);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isHigh ? '#f59e0b' : '#06b6d4')
      .attr('stop-opacity', 0.03);

    // Scales
    const xExtent = d3.extent(timelineData, (d) => d.time) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, chartWidth]);

    const yMax = Math.max(gpuStatus.totalVramGb, 6);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([chartHeight, 0]);

    // Background horizontal gridlines
    const yAxisGrid = d3.axisLeft(yScale).ticks(5).tickSize(-chartWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,2');

    // Custom Warning Threshold line (user defined or default 85%)
    const effectiveThresh = thresholdGb ?? (gpuStatus.totalVramGb * 0.85);
    const warnY = yScale(effectiveThresh);
    const isExceeded = gpuStatus.usedVramGb >= effectiveThresh;

    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', warnY)
      .attr('y2', warnY)
      .attr('stroke', isExceeded ? '#f43f5e' : '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    g.append('text')
      .attr('x', chartWidth - 6)
      .attr('y', warnY - 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', isExceeded ? '#fca5a5' : '#fbbf24')
      .text(`Kritische Warnschwelle: ${effectiveThresh.toFixed(1)} GB ${isExceeded ? '(ALARM: ÜBERSCHRITTEN)' : ''}`);

    // Total GPU limit line
    const limitY = yScale(gpuStatus.totalVramGb);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', limitY)
      .attr('y2', limitY)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5);

    g.append('text')
      .attr('x', 6)
      .attr('y', limitY - 4)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#f87171')
      .text(`Max VRAM Limit (${gpuStatus.totalVramGb} GB)`);

    // D3 Area & Line
    const area = d3
      .area<TimelinePoint>()
      .x((d) => xScale(d.time))
      .y0(chartHeight)
      .y1((d) => yScale(d.totalGb))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<TimelinePoint>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.totalGb))
      .curve(d3.curveMonotoneX);

    // Draw area
    g.append('path')
      .datum(timelineData)
      .attr('fill', 'url(#vram-area-gradient)')
      .attr('d', area);

    // Draw line
    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', isHigh ? '#f59e0b' : '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Pulse dot at current point
    const lastPoint = timelineData[timelineData.length - 1];
    if (lastPoint) {
      const lastX = xScale(lastPoint.time);
      const lastY = yScale(lastPoint.totalGb);

      g.append('circle')
        .attr('cx', lastX)
        .attr('cy', lastY)
        .attr('r', 6)
        .attr('fill', isHigh ? '#f59e0b' : '#06b6d4')
        .attr('opacity', 0.4)
        .attr('class', 'animate-ping');

      g.append('circle')
        .attr('cx', lastX)
        .attr('cy', lastY)
        .attr('r', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', isHigh ? '#f59e0b' : '#06b6d4')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', lastX - 8)
        .attr('y', lastY - 8)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#f8fafc')
        .text(`${lastPoint.totalGb} GB`);
    }

    // Y Axis (GB)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d} GB`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '9.5px')
      .attr('fill', '#94a3b8');

    // X Axis (Time)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#64748b');
  };

  return (
    <div
      ref={containerRef}
      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md space-y-3 relative overflow-hidden"
    >
      {/* Top Header & Chart View Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              D3.js VRAM-Nutzungsdiagramm & Speicherwächter
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/60">
                GPU Engine
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Präzise Vektorvisualisierung für Windows 11 DirectML / CUDA Speicherebenen
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setChartViewMode('breakdown')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'breakdown'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Speicheraufteilung nach DWM, Modell und Cache"
          >
            <PieIcon className="w-3 h-3" />
            <span>Aufteilung</span>
          </button>

          <button
            onClick={() => setChartViewMode('comparison')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'comparison'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vergleich verschiedener Ollama-Modelle gegen GPU-Limit"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Modell-Vergleich</span>
          </button>

          <button
            onClick={() => setChartViewMode('timeline')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Echtzeit VRAM-Lastverlauf & Inferenz-Spikes"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Lastverlauf</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas rendered with D3 */}
      <div className="w-full relative flex items-center justify-center bg-slate-900/40 rounded-lg border border-slate-800/60 pt-1">
        <svg
          ref={svgRef}
          width="100%"
          height="280"
          className="overflow-visible select-none"
        />

        {/* Interactive Hover Tooltip Overlay for Breakdown */}
        {hoveredSlice && viewMode === 'breakdown' && (
          <div className="absolute top-2 left-2 bg-slate-900/95 border border-slate-700 text-slate-100 p-2.5 rounded-lg shadow-xl text-xs max-w-xs pointer-events-none backdrop-blur animate-in fade-in z-20">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: hoveredSlice.color }}
              />
              <span>{hoveredSlice.title}</span>
            </div>
            <div className="text-slate-300 text-[11px] mb-1">
              <strong>{hoveredSlice.valueGb.toFixed(2)} GB</strong> ({hoveredSlice.percent}% des gesamten GPU-VRAMs)
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              {hoveredSlice.description}
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Summary Badges & Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-950 border border-indigo-800/60 text-indigo-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Windows 11 DWM Reserve:</span>
            <span className="font-semibold text-slate-200">
              {gpuStatus.breakdown.windows11DwmGb} GB Fest reserviert
            </span>
          </div>
        </div>

        <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-950 border border-cyan-800/60 text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Aktives Modell Offload:</span>
            <span className="font-semibold text-cyan-300">
              {gpuStatus.activeModel.gpuOffloadPercent}% auf {gpuStatus.gpuName.split(' ')[0] || 'GPU'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-md shrink-0 border ${
              gpuStatus.vramPercent >= 90
                ? 'bg-rose-950 border-rose-800 text-rose-400'
                : gpuStatus.vramPercent >= 75
                ? 'bg-amber-950 border-amber-800 text-amber-400'
                : 'bg-emerald-950 border-emerald-800 text-emerald-400'
            }`}
          >
            {gpuStatus.vramPercent >= 90 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Status GPU-VRAM Wächter:</span>
            <span
              className={`font-semibold ${
                gpuStatus.vramPercent >= 90
                  ? 'text-rose-300'
                  : gpuStatus.vramPercent >= 75
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {gpuStatus.vramPercent >= 90
                ? 'Kritischer RAM-Überlauf'
                : gpuStatus.vramPercent >= 75
                ? 'Grenzbereich (>75%)'
                : 'Vollständiges GPU-Offload'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
