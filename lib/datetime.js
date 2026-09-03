const twoDigit = n => String(n).padStart(2, '0')

// REDCap emits date-only values for date_* fields, minute precision for
// datetime_* fields, and seconds only for datetime_seconds_* fields.
const format = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/

export default class REDCapDatetime extends Date {
  constructor (...args) {
    if (args.length === 1 && typeof args[0] === 'string') super(REDCapDatetime.parse(args[0]))
    else super(...args)
  }

  toString () {
    return [[
      String(this.getFullYear()),
      twoDigit(1 + this.getMonth()),
      twoDigit(this.getDate())
    ].join('-'), [
      twoDigit(this.getHours()),
      twoDigit(this.getMinutes()),
      twoDigit(this.getSeconds())
    ].join(':')].join(' ')
  }

  static parse (s) {
    if (typeof s !== 'string') throw new TypeError('must be “YYYY-MM-DD[ hh:mm[:ss]]” format')
    const match = s.trim().match(format)
    if (!match) throw new TypeError('must be “YYYY-MM-DD[ hh:mm[:ss]]” format')
    const [year, month, date, hours = 0, minutes = 0, seconds = 0] = match.slice(1).map(digits => digits === undefined ? undefined : Number.parseInt(digits, 10))
    return (new Date(year, month - 1, date, hours, minutes, seconds, 0)).getTime()
  }
}
