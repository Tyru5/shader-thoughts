import { RESOLUTIONS } from "../utils/snapshot";

export interface GalleryOptions {
  shaderNames: string[];
  onShaderSelect: (name: string) => void;
  onBloomToggle: (enabled: boolean) => void;
  onBloomStrengthChange: (strength: number) => void;
  onFullscreen: () => void;
  onSnapshot: (resolution: { width: number; height: number }) => void;
}

export class ShaderGallery {
  private container: HTMLElement;
  private shaderList!: HTMLElement;
  private currentIndex = 0;
  private options: GalleryOptions;
  private isVisible = true;
  private hint!: HTMLElement;

  constructor(options: GalleryOptions) {
    this.options = options;
    this.container = this.createUI();
    this.hint = this.createHint();
    document.body.appendChild(this.container);
    document.body.appendChild(this.hint);
    this.setupKeyboardNav();
  }

  private createHint(): HTMLElement {
    const hint = document.createElement("div");
    hint.className = "ui-hint hidden";
    hint.textContent = "Press H to show UI";
    return hint;
  }

  toggleUI() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle("hidden", !this.isVisible);
    this.hint.classList.toggle("hidden", this.isVisible);
  }

  private createUI(): HTMLElement {
    const container = document.createElement("div");
    container.className = "shader-gallery";
    container.innerHTML = `
      <div class="gallery-header">
        <h1 class="gallery-title">Shader Thoughts</h1>
        <div class="gallery-controls">
          <label class="bloom-toggle">
            <input type="checkbox" id="bloom-enabled">
            <span>Bloom</span>
          </label>
          <input type="range" id="bloom-strength" min="0" max="2" step="0.1" value="0.5">
          <select id="resolution-select">
            ${RESOLUTIONS.map((r, i) => `<option value="${i}">${r.label}</option>`).join("")}
          </select>
          <button id="snapshot-btn" title="Save Screenshot">📷</button>
          <button id="fullscreen-btn" title="Fullscreen">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="shader-list"></div>
      <div class="gallery-nav">
        <button id="prev-shader">&larr;</button>
        <span id="shader-counter">1 / ${this.options.shaderNames.length}</span>
        <button id="next-shader">&rarr;</button>
      </div>
      <div class="keyboard-hint">Press H to hide UI</div>
    `;

    this.shaderList = container.querySelector(".shader-list")!;
    this.renderShaderList();

    const bloomCheckbox = container.querySelector("#bloom-enabled") as HTMLInputElement;
    bloomCheckbox.addEventListener("change", () => {
      this.options.onBloomToggle(bloomCheckbox.checked);
    });

    const bloomStrength = container.querySelector("#bloom-strength") as HTMLInputElement;
    bloomStrength.addEventListener("input", () => {
      this.options.onBloomStrengthChange(parseFloat(bloomStrength.value));
    });

    const resolutionSelect = container.querySelector("#resolution-select") as HTMLSelectElement;
    const snapshotBtn = container.querySelector("#snapshot-btn")!;
    snapshotBtn.addEventListener("click", () => {
      const idx = parseInt(resolutionSelect.value, 10);
      this.options.onSnapshot(RESOLUTIONS[idx]);
    });

    const fullscreenBtn = container.querySelector("#fullscreen-btn")!;
    fullscreenBtn.addEventListener("click", () => this.options.onFullscreen());

    const prevBtn = container.querySelector("#prev-shader")!;
    const nextBtn = container.querySelector("#next-shader")!;
    prevBtn.addEventListener("click", () => this.navigate(-1));
    nextBtn.addEventListener("click", () => this.navigate(1));

    return container;
  }

  private renderShaderList() {
    this.shaderList.innerHTML = this.options.shaderNames
      .map(
        (name, i) =>
          `<button class="shader-item${i === this.currentIndex ? " active" : ""}" data-index="${i}">${name}</button>`
      )
      .join("");

    this.shaderList.querySelectorAll(".shader-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt((btn as HTMLElement).dataset.index!, 10);
        this.selectShader(index);
      });
    });
  }

  private selectShader(index: number) {
    this.currentIndex = index;
    const name = this.options.shaderNames[index];
    this.options.onShaderSelect(name);
    this.updateUI();
  }

  private navigate(dir: number) {
    const len = this.options.shaderNames.length;
    this.currentIndex = (this.currentIndex + dir + len) % len;
    this.selectShader(this.currentIndex);
  }

  private updateUI() {
    this.shaderList.querySelectorAll(".shader-item").forEach((btn, i) => {
      btn.classList.toggle("active", i === this.currentIndex);
    });
    const counter = this.container.querySelector("#shader-counter")!;
    counter.textContent = `${this.currentIndex + 1} / ${this.options.shaderNames.length}`;
  }

  private getSelectedResolution(): { width: number; height: number } {
    const select = this.container.querySelector("#resolution-select") as HTMLSelectElement;
    const idx = parseInt(select.value, 10);
    return RESOLUTIONS[idx];
  }

  triggerSnapshot() {
    this.options.onSnapshot(this.getSelectedResolution());
  }

  private setupKeyboardNav() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.navigate(-1);
      else if (e.key === "ArrowRight") this.navigate(1);
      else if (e.key.toLowerCase() === "h") this.toggleUI();
      else if (e.key.toLowerCase() === "s") this.triggerSnapshot();
    });
  }

  destroy() {
    this.container.remove();
  }
}
