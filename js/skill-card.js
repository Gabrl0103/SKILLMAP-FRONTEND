class SkillCard extends HTMLElement {
  static get observedAttributes() { return ["name", "status", "demand", "size"]; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
  render() {
    const name = this.getAttribute("name") || "Habilidad";
    const status = this.getAttribute("status") || "pending";
    const demand = Number(this.getAttribute("demand") || 0);
    const size = this.getAttribute("size") || "md";
    const metaMap = {
      mastered: { label: "Dominada", classes: "bg-[#5FD9AA]/15 border-[#5FD9AA] text-[#1f7a54]", dot: "bg-[#5FD9AA]" },
      progress: { label: "En desarrollo", classes: "bg-[#D95F8E]/15 border-[#D95F8E] text-[#a6285a]", dot: "bg-[#D95F8E]" },
      pending: { label: "Por aprender", classes: "bg-gray-100 border-gray-300 border-dashed text-gray-500", dot: "bg-gray-300" },
    };
    const m = metaMap[status] || metaMap.pending;
    this.className = `w-full rounded-lg border p-3 flex items-center justify-between gap-3 ${m.classes}`;
    this.innerHTML = `
      <div>
        <p class="font-medium text-sm">${name}</p>
        <p class="text-xs opacity-80">${m.label}</p>
      </div>
      <span class="text-xs font-mono">${demand}%</span>`;
  }
}
customElements.define("skill-card", SkillCard);
