import type { TaskClock } from '../../application/ports/task-clock.port'

export class SystemTaskClock implements TaskClock {
    now(): Date {
        return new Date()
    }
}
