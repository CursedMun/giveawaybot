import { SnowflakeUtil } from "discord.js";
import { config } from "./config";

export default class Timer {
  private cache = new Map<string, { date: number; fn: () => void }>();
  private lastTick = Date.now();
  private checkInterval: number;
  constructor(
    date: number,
    fn: () => void,
    checkInterval = config.ticks.tenSeconds
  ) {
    this.checkInterval = checkInterval;
    this.lastTick = Date.now();
    this.set(date, fn);
    this.tick();
  }
  get nextTick() {
    return this.lastTick + this.checkInterval;
  }

  set(date: number, fn: () => void) {
    if (this.nextTick > date) {
      return this.cache.set(SnowflakeUtil.generate(), { date, fn });
    }
    return this.timeout(fn, date - Date.now());
  }
  tick() {
    this.lastTick = Date.now();
    for (const [id, val] of this.cache) {
      if (val.date <= this.nextTick) {
        this.timeout(
          val.fn,
          val.date - Date.now() < 0 ? 0 : val.date - Date.now()
        );
        this.cache.delete(id);
      }
    }
    setTimeout(() => {
      this.tick();
    }, this.checkInterval);
  }

  timeout(fn: () => void, time = 0) {
    return setTimeout(() => fn(), time);
  }
  destroy(){
    for (const [id, val] of this.cache) {
      val.fn();
    }
    this.cache.clear();
  }
}
