const twoDigit = n => String(n).padStart(2, '0')

export default class REDCapDatetime extends Date {
  constructor () {
    super()
    if (arguments.length === 1 && typeof arguments[0] === 'string') {
      super.setTime(REDCapDatetime.parse(arguments[0]))
    }
  }

  toString () {
    return [[
      String(super.getFullYear()),
      twoDigit(1 + super.getMonth()),
      twoDigit(super.getDate())
    ].join('-'), [
      twoDigit(super.getHours()),
      twoDigit(super.getMinutes()),
      twoDigit(super.getSeconds())
    ].join(':')].join(' ')
  }

  static parse (s) {
    if (typeof s !== 'string' || s.length !== 19) throw new TypeError('must be “YYYY-MM-DD hh:mm:ss” format')
    const [datePart, timePart] = s.split(' ', 2)
    const [year, month, date] = datePart.split('-', 3).map(digits => Number.parseInt(digits, 10))
    const [hours, minutes, seconds] = timePart.split(':', 3).map(digits => Number.parseInt(digits, 10))
    return (new Date(year, month - 1, date, hours, minutes, seconds, 0)).getTime()
  }
}
