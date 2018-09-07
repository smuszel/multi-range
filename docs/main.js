const clamp = val => Math.max(Math.min(1, val), 0);
class MultiRange extends HTMLElement {
    constructor() {
        super();
        this.hasFullyConnected = false;
        this.defaults = {
            firstHandlePosition: 0.5,
            secondHandlePosition: 0.5,
            numberOfTicks: 20
        };
        this.startMouseTracking = startEv => {
            const target = startEv.target;
            const trackMouse = trackEv => {
                const realtiveMouseX = trackEv.clientX - this.offsetLeft;
                const fr = realtiveMouseX / this.offsetWidth;
                this.setHandlePositionSafely(fr, target);
            };
            const dispose = () => document.removeEventListener('mousemove', trackMouse);
            document.addEventListener('mousemove', trackMouse);
            document.addEventListener('mouseup', dispose);
        };
        this.moveClosestHandle = ev => {
            const direct = ev.target === this;
            if (direct) {
                const realtiveMouseX = ev.clientX - this.offsetLeft;
                const fraction = realtiveMouseX / this.offsetWidth;
                const tick = this.fractionToTick(fraction);
                const distanceToFirst = Math.abs(this.fst.position - tick);
                const distanceToSecond = Math.abs(this.snd.position - tick);
                const firstHandleCloser = distanceToFirst < distanceToSecond;
                firstHandleCloser
                    ? this.fst.position = tick
                    : this.snd.position = tick;
            }
        };
    }
    static get observedAttributes() {
        return ['ticks'];
    }
    attributeChangedCallback(name, newV, oldV) {
        if (this.hasFullyConnected) {
            this.resetHandles();
            this.dispatchChange();
        }
    }
    connectedCallback() {
        this.setUpDOM();
        this.resetHandles();
        this.hasFullyConnected = true;
    }
    setUpDOM() {
        const create = () => {
            this.fst = document.createElement('span');
            this.snd = document.createElement('span');
        };
        const setClasses = () => {
            this.fst.className = 'handle handle-fst';
            this.snd.className = 'handle handle-snd';
        };
        const addListeners = () => {
            this.addEventListener('dragstart', ev => ev.preventDefault());
            this.addEventListener('click', this.moveClosestHandle);
            this.fst.addEventListener('dragstart', ev => ev.preventDefault());
            this.snd.addEventListener('dragstart', ev => ev.preventDefault());
            this.fst.addEventListener('mousedown', this.startMouseTracking);
            this.snd.addEventListener('mousedown', this.startMouseTracking);
        };
        const enhanceHandles = () => {
            Reflect.defineProperty(this.fst, 'position', {
                get: () => {
                    const propValue = this.style.getPropertyValue('--fst').replace('%', '');
                    const fr = parseInt(propValue) / 100;
                    return this.fractionToTick(fr);
                },
                set: (tick) => {
                    const p = this.tickToFraction(tick) * 100;
                    this.style.setProperty('--fst', `${p}%`);
                    this.flipCheck();
                    this.dispatchChange();
                }
            });
            Reflect.defineProperty(this.snd, 'position', {
                get: () => {
                    const propValue = this.style.getPropertyValue('--snd').replace('%', '');
                    const fr = parseInt(propValue) / 100;
                    return this.fractionToTick(fr);
                },
                set: (tick) => {
                    const p = this.tickToFraction(tick) * 100;
                    this.style.setProperty('--snd', `${p}%`);
                    this.flipCheck();
                    this.dispatchChange();
                }
            });
        };
        const append = () => {
            this.appendChild(this.fst);
            this.appendChild(this.snd);
        };
        create();
        setClasses();
        addListeners();
        enhanceHandles();
        append();
    }
    resetHandles() {
        this.fst.position = this.fractionToTick(this.defaults.firstHandlePosition);
        this.snd.position = this.fractionToTick(this.defaults.secondHandlePosition);
    }
    tickToFraction(tick) {
        return tick / this.numberOfTicks;
    }
    fractionToTick(fr) {
        return Math.round(fr * this.numberOfTicks);
    }
    flipCheck() {
        if (this.fst.position > this.snd.position) {
            this.setAttribute('flipped', 'true');
        }
        else {
            this.removeAttribute('flipped');
        }
    }
    dispatchChange() {
        const detail = [this.min, this.max];
        const ev = new CustomEvent('change', { detail });
        this.dispatchEvent(ev);
    }
    setHandlePositionSafely(fr, target) {
        const clamped = clamp(fr);
        const newTick = this.fractionToTick(clamped);
        const differs = newTick !== target.position;
        if (differs) {
            target.position = newTick;
        }
    }
    get numberOfTicks() {
        const v = this.getAttribute('ticks');
        return parseInt(v) || this.defaults.numberOfTicks;
    }
    get min() {
        return Math.min(this.fst.position, this.snd.position);
    }
    get max() {
        return Math.max(this.fst.position, this.snd.position);
    }
}
customElements.define('multi-range', MultiRange);
