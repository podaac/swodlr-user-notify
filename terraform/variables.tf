variable "app_name" {
    default = "swodlr"
    type = string
}

variable "service_name" {
    default = "user-notify"
    type = string
}

variable "default_tags" {
    type = map(string)
    default = {}
}

variable "stage" {
    type = string
}

variable "region" {
    type = string
}

variable "log_level" {
    type = string
    default = "INFO"
}

variable "ses_credentials" {
    type = string
}

variable "ses_region" {
    type = string
}

variable "tea_mapping" {
    type = map(string)
}
