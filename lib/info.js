import REDCapDatetime from './datetime.js'

export default class REDCapProjectInformation {
  #project_id
  #project_title
  #creation_time
  #production_time
  #in_production
  #project_language
  #purpose
  #purpose_other
  #project_notes
  #custom_record_label
  #secondary_unique_field
  #is_longitudinal
  #has_repeating_instruments_or_events
  #surveys_enabled
  #scheduling_enabled
  #record_autonumbering_enabled
  #randomization_enabled
  #ddp_enabled
  #project_irb_number
  #project_grant_number
  #project_pi_firstname
  #project_pi_lastname
  #display_today_now_button
  #missing_data_codes
  #external_modules
  #bypass_branching_erase_field_prompt

  constructor (o) {
    this.#project_id = o?.project_id
    this.#project_title = o?.project_title
    this.#creation_time = o?.creation_time
    this.#production_time = o?.production_time
    this.#in_production = o?.in_production
    this.#project_language = o?.project_language
    this.#purpose = o?.purpose
    this.#purpose_other = o?.purpose_other
    this.#project_notes = o?.project_notes
    this.#custom_record_label = o?.custom_record_label
    this.#secondary_unique_field = o?.secondary_unique_field
    this.#is_longitudinal = o?.is_longitudinal
    this.#has_repeating_instruments_or_events = o?.has_repeating_instruments_or_events
    this.#surveys_enabled = o?.surveys_enabled
    this.#scheduling_enabled = o?.scheduling_enabled
    this.#record_autonumbering_enabled = o?.record_autonumbering_enabled
    this.#randomization_enabled = o?.randomization_enabled
    this.#ddp_enabled = o?.ddp_enabled
    this.#project_irb_number = o?.project_irb_number
    this.#project_grant_number = o?.project_grant_number
    this.#project_pi_firstname = o?.project_pi_firstname
    this.#project_pi_lastname = o?.project_pi_lastname
    this.#display_today_now_button = o?.display_today_now_button
    this.#missing_data_codes = o?.missing_data_codes
    this.#external_modules = o?.external_modules
    this.#bypass_branching_erase_field_prompt = o?.bypass_branching_erase_field_prompt
  }

  get id () {
    return this.#project_id
  }

  get title () {
    return this.#project_title === '' ? null : this.#project_title
  }

  get creationTime () {
    return new Date(REDCapDatetime.parse(this.#creation_time))
  }

  get productionTime () {
    return new Date(REDCapDatetime.parse(this.#production_time))
  }

  get inProduction () {
    return Boolean(this.#in_production)
  }

  get language () {
    return this.#project_language === '' ? null : this.#project_language
  }

  get purpose () {
    return this.#purpose
  }

  get purposeOther () {
    return this.#purpose_other === '' ? null : this.#purpose_other
  }

  get notes () {
    return this.#project_notes === '' ? null : this.#project_notes
  }

  get customRecordLabel () {
    return this.#custom_record_label === '' ? null : this.#custom_record_label
  }

  get secondaryUniqueField () {
    return this.#secondary_unique_field === '' ? null : this.#secondary_unique_field
  }

  get isLongitudinal () {
    return Boolean(this.#is_longitudinal)
  }

  get hasRepeatingInstrumentsOrEvents () {
    return Boolean(this.#has_repeating_instruments_or_events)
  }

  get surveysEnabled () {
    return Boolean(this.#surveys_enabled)
  }

  get schedulingEnabled () {
    return Boolean(this.#scheduling_enabled)
  }

  get recordAutonumberingEnabled () {
    return Boolean(this.#record_autonumbering_enabled)
  }

  get randomizationEnabled () {
    return Boolean(this.#randomization_enabled)
  }

  get ddpEnabled () {
    return Boolean(this.#ddp_enabled)
  }

  get irbNumber () {
    return this.#project_irb_number === '' ? null : this.#project_irb_number
  }

  get grantNumber () {
    return this.#project_grant_number === '' ? null : this.#project_grant_number
  }

  get piFirstname () {
    return this.#project_pi_firstname === '' ? null : this.#project_pi_firstname
  }

  get piLastname () {
    return this.#project_pi_lastname === '' ? null : this.#project_pi_lastname
  }

  get displayTodayNowButton () {
    return Boolean(this.#display_today_now_button)
  }

  get missingDataCodes () {
    return this.#missing_data_codes === '' ? null : this.#missing_data_codes
  }

  get externalModules () {
    return this.#external_modules === '' ? null : this.#external_modules
  }

  get bypassBranchingEraseFieldPrompt () {
    return Boolean(this.#bypass_branching_erase_field_prompt)
  }
}
