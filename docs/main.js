const clamp = val => Math.max(Math.min(1, val), 0);
class MultiRange extends HTMLElement {
    constructor() {
        super();
        this.defaults = {
            firstHandlePosition: 0.5,
            secondHandlePosition: 0.5,
            numberOfTicks: 20
        };
        this.startMouseTracking = startEv => {
            const target = startEv.target;
            const trackMouse = trackEv => {
                const realtiveMouseX = trackEv.clientX - this.offsetLeft;
                const percentage = realtiveMouseX / this.offsetWidth;
                target.moveTo(percentage);
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
                const distanceToFirst = Math.abs(this.fst - tick);
                const distanceTosecond = Math.abs(this.snd - tick);
                const firstHandleCloser = distanceToFirst < distanceTosecond;
                firstHandleCloser
                    ? this.fst = fraction
                    : this.snd = fraction;
            }
        };
    }
    static get observedAttributes() {
        return ['ticks'];
    }
    attributeChangedCallback(name, newV, oldV) {
        debugger;
        this.syncHandles();
        this.dispatchChange();
    }
    connectedCallback() {
        this.setUpDOM();
        this.syncHandles();
    }
    setUpDOM() {
        const create = () => {
            this.handle1 = document.createElement('span');
            this.handle2 = document.createElement('span');
        };
        const setClasses = () => {
            this.handle1.className = 'handle handle-fst';
            this.handle2.className = 'handle handle-snd';
        };
        const addListeners = () => {
            this.addEventListener('dragstart', ev => ev.preventDefault());
            this.addEventListener('click', this.moveClosestHandle);
            this.handle1.addEventListener('dragstart', ev => ev.preventDefault());
            this.handle2.addEventListener('dragstart', ev => ev.preventDefault());
            this.handle1.addEventListener('mousedown', this.startMouseTracking);
            this.handle2.addEventListener('mousedown', this.startMouseTracking);
        };
        const misc = () => {
            this.handle1.moveTo = fr => this.fst = fr;
            this.handle2.moveTo = fr => this.snd = fr;
        };
        const append = () => {
            this.appendChild(this.handle1);
            this.appendChild(this.handle2);
        };
        create();
        setClasses();
        addListeners();
        misc();
        append();
    }
    syncHandles() {
        this.fst = this.defaults.firstHandlePosition;
        this.snd = this.defaults.secondHandlePosition;
    }
    tickToFraction(tick) {
        return 100 * tick / this.numberOfTicks;
    }
    fractionToTick(fr) {
        return Math.round(fr * this.numberOfTicks);
    }
    flipCheck() {
        if (this.fst > this.snd) {
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
        const differs = newTick !==
        ;
        if (differs) {
            const p = this.tickToFraction(newTick);
        }
    }
    get numberOfTicks() {
        const v = this.getAttribute('ticks');
        return parseInt(v) || this.defaults.numberOfTicks;
    }
    set fst(p) {
        this.style.setProperty('--fst', `${p}%`);
        this.flipCheck();
        this.dispatchChange();
    }
    get fst() {
        const propValue = this.style.getPropertyValue('--fst').replace('%', '');
        const fr = parseInt(propValue) / 100;
        return this.fractionToTick(fr);
    }
    set snd(p) {
        const clamped = clamp(fr);
        const newTick = this.fractionToTick(clamped);
        const differs = newTick !== this.snd;
        if (differs) {
            const p = this.tickToFraction(newTick);
            this.style.setProperty('--snd', `${p}%`);
            this.flipCheck();
            this.dispatchChange();
        }
    }
    get snd() {
        const propValue = this.style.getPropertyValue('--snd').replace('%', '');
        const fr = parseInt(propValue) / 100;
        return this.fractionToTick(fr);
    }
    get min() {
        return Math.min(this.fst, this.snd);
    }
    get max() {
        return Math.max(this.fst, this.snd);
    }
}
customElements.define('multi-range', MultiRange);
