const CHOICE_TYPES = ['checkbox', 'radio', 'dropdown']

// “1, Cough | 2, Fever” → Map { '1' => 'Cough', '2' => 'Fever' }
// Option codes cannot contain a comma but labels can, so split on the first one.
// Entries that cannot yield a pair are skipped rather than throwing: one odd
// row in a data dictionary should not make the whole project unreadable.
function parseChoices (spec) {
  const choices = new Map()
  if (typeof spec !== 'string') return choices
  for (const entry of spec.split('|')) {
    const choice = entry.trim()
    if (choice === '') continue
    const comma = choice.indexOf(',')
    if (comma === -1) continue
    choices.set(choice.slice(0, comma).trim(), choice.slice(1 + comma).trim())
  }
  return choices
}

export default class REDCapField {
  #field_name
  #form_name
  #section_header
  #field_type
  #field_label
  #select_choices_or_calculations
  #field_note
  #text_validation_type_or_show_slider_number
  #text_validation_min
  #text_validation_max
  #identifier
  #branching_logic
  #required_field
  #custom_alignment
  #question_number
  #matrix_group_name
  #matrix_ranking
  #field_annotation
  #choices

  constructor (o) {
    this.#field_name = o?.field_name
    this.#form_name = o?.form_name
    this.#section_header = o?.section_header
    this.#field_type = o?.field_type
    this.#field_label = o?.field_label
    this.#select_choices_or_calculations = o?.select_choices_or_calculations
    this.#field_note = o?.field_note
    this.#text_validation_type_or_show_slider_number = o?.text_validation_type_or_show_slider_number
    this.#text_validation_min = o?.text_validation_min
    this.#text_validation_max = o?.text_validation_max
    this.#identifier = o?.identifier
    this.#branching_logic = o?.branching_logic
    this.#required_field = o?.required_field
    this.#custom_alignment = o?.custom_alignment
    this.#question_number = o?.question_number
    this.#matrix_group_name = o?.matrix_group_name
    this.#matrix_ranking = o?.matrix_ranking
    this.#field_annotation = o?.field_annotation

    if (CHOICE_TYPES.includes(this.#field_type)) {
      this.#choices = parseChoices(this.#select_choices_or_calculations)
    }
  }

  get name () {
    return this.#field_name
  }

  get instrument () {
    return this.#form_name
  }

  get section_header () {
    return this.#section_header
  }

  get type () {
    return this.#field_type
  }

  get label () {
    return this.#field_label
  }

  get select_choices_or_calculations () {
    return this.#select_choices_or_calculations
  }

  get note () {
    return this.#field_note
  }

  get text_validation_type_or_show_slider_number () {
    return this.#text_validation_type_or_show_slider_number
  }

  get text_validation_min () {
    return this.#text_validation_min
  }

  get text_validation_max () {
    return this.#text_validation_max
  }

  get identifier () {
    return this.#identifier
  }

  get branching_logic () {
    return this.#branching_logic
  }

  get required_field () {
    return this.#required_field
  }

  get custom_alignment () {
    return this.#custom_alignment
  }

  get question_number () {
    return this.#question_number
  }

  get matrix_group_name () {
    return this.#matrix_group_name
  }

  get matrix_ranking () {
    return this.#matrix_ranking
  }

  get field_annotation () {
    return this.#field_annotation
  }

  get choices () {
    return this.#choices
  }
}
