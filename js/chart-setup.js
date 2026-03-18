// ── Chart.js setup ────────────────────────────────────────────────────────────
// Registers the datalabels plugin and configures default label rendering
// for doughnut charts used in the tokenization slide (section 2).
// ── end Chart.js setup ───────────────────────────────────────────────────────

Chart.register(ChartDataLabels);

Chart.defaults.plugins.datalabels = {
  display: true,
  anchor: function (ctx) {
    var data = ctx.dataset.data;
    var total = data.reduce(function (a, b) { return a + b; }, 0);
    return data[ctx.dataIndex] / total > 0.05 ? "center" : "end";
  },
  align: function (ctx) {
    var data = ctx.dataset.data;
    var total = data.reduce(function (a, b) { return a + b; }, 0);
    return data[ctx.dataIndex] / total > 0.05 ? "center" : "end";
  },
  offset: function (ctx) {
    var data = ctx.dataset.data;
    var total = data.reduce(function (a, b) { return a + b; }, 0);
    return data[ctx.dataIndex] / total > 0.05 ? 0 : 6;
  },
  formatter: function (value, ctx) {
    var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
    return ((value / total) * 100).toFixed(1) + "%";
  },
  color: "#073642",
  font: function (ctx) {
    var data = ctx.dataset.data;
    var total = data.reduce(function (a, b) { return a + b; }, 0);
    return data[ctx.dataIndex] / total > 0.05
      ? { size: 16, weight: "bold" }
      : { size: 11, weight: "bold" };
  },
};
