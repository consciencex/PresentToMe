/* ===== link to the presenter window (dist/presenter.html): state out, next / prev in ===== */
// Every message goes on both channels: BroadcastChannel needs one origin (http), postMessage to the popup also works between file:// pages.
const Presenter = {
  win: null, bc: null, seen: new Set(),
  init() {
    if (!HAS_PRESENTER) return;
    try { this.bc = new BroadcastChannel('deck'); this.bc.onmessage = e => this.receive(e.data, null); } catch (e) {}
    window.addEventListener('message', e => { if (e.source && e.source !== window) this.receive(e.data, e.source); });
  },
  open() { if (!HAS_PRESENTER) return; if (this.win && !this.win.closed) { this.win.focus(); return; } this.win = window.open('presenter.html', 'deckPresenter', 'popup,width=1180,height=760'); },
  send(msg) {
    if (this.bc) try { this.bc.postMessage(msg); } catch (e) {}
    if (this.win && !this.win.closed) try { this.win.postMessage(msg, '*'); } catch (e) {}
  },
  publish() { if (HAS_PRESENTER && Deck.slides.length) this.send({ type: 'state', i: Deck.i, step: Deck.step }); },
  receive(m, source) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'hello') { if (source) this.win = source; this.publish(); }
    else if (m.type === 'cmd') {
      if (this.seen.has(m.seq)) return;          // the same command arrives on both channels
      this.seen.add(m.seq);
      if (Deck.modal) return;
      if (m.cmd === 'next') Deck.next(); else if (m.cmd === 'prev') Deck.prev();
    }
  }
};
Presenter.init();
