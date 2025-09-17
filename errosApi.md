[
{"errorCode":"rate_01","status":"429","msg":"Rate limit exceeded. Please try again later."},

{"errorCode":"auth_01","status":"400","msg":"Error on verify token"},
{"errorCode":"auth_02","status":"400","msg":"Token required"},
{"errorCode":"auth_03","status":"400","msg":"Channel cannot be found, contact us for more details"},
{"errorCode":"auth_04","status":"400","msg":"Channel was deleted, contact us for more details"},
{"errorCode":"auth_05","status":"400","msg":"Organization cannot be found, contact us for more details"},
{"errorCode":"auth_06","status":"400","msg":"Organization was deleted, contact us for more details"},
{"errorCode":"auth_07","status":"400","msg":"System cannot be found, contact us for more details"},
{"errorCode":"auth_08","status":"400","msg":"Channel not connected, contact us for more details"},
{"errorCode":"auth_09","status":"400","msg":"Inconsistencies in the system data, contact us for more details"},
{"errorCode":"auth_10","status":"400","msg":"Locked system, contact us for more details"},
{"errorCode":"auth_11","status":"400","msg":"Api module not released, contact us for more details"},
{"errorCode":"auth_12","status":"400","msg":"Chatbot module not released, contact us for more details"},
{"errorCode":"auth_13","status":"400","msg":"This system can't access this endpoint"},

{"errorCode":"body_01","status":"400","msg":"Data body is required."},
{"errorCode":"body_02","status":"400","msg":"*Generated according to incorrect body fields"},

{"errorCode":"param_01","status":"400","msg":"*Generated according to incorrect body fields"},

{"errorCode":"num_01","status":"400","msg":"Number is required"},
{"errorCode":"num_02","status":"400","msg":"Number is not valid"},
{"errorCode":"num_03","status":"400","msg":"The number {number} is invalid, check the problem NOT_VALIDED"},
{"errorCode":"num_04","status":"400","msg":"The number {number} is invalid, check the problem INVALID_WA_NUMBER"},
{"errorCode":"num_05","status":"400","msg":"The number {number} is invalid, check the problem INCORRECT_NUMBER"},
{"errorCode":"num_06","status":"400","msg":"The number {number} is invalid, check the problem NOT_FOUNT"},
{"errorCode":"num_07","status":"400","msg":"This action requires the target number to have an open attendance"},

{"errorCode":"chat_01","status":"400","msg":"Chat ID is required!"},
{"errorCode":"chat_02","status":"400","msg":"Chat not found!"},
{"errorCode":"chat_03","status":"400","msg":"Chat already openned, verify or change 'ForceSend' option"},
{"errorCode":"chat_04","status":"400","msg":"this contact have no interaction before, verify or change 'verify' option"},
{"errorCode":"chat_05","status":"400","msg":"this chat was finalized"},
{"errorCode":"chat_06","status":"400","msg":"this business is not configured to use chatbot, check on business >> edit >> configurations >> chatbot"},
{"errorCode":"chat_07","status":"400","msg":"menuId required"},
{"errorCode":"chat_08","status":"400","msg":"Nothing to send, verify"},
{"errorCode":"chat_09","status":"400","msg":"Invalids number(s): {list_numbers}"},
{"errorCode":"chat_10","status":"400","msg":"This user cannot use this sectorId, check permissions of this user."},
{"errorCode":"chat_11","status":"400","msg":"Chat already openned"},
{"errorCode":"chat_12","status":"400","msg":"Error on sent message"},
{"errorCode":"chat_13","status":"400","msg":"Error on create chat"},
{"errorCode":"chat_14","status":"400","msg":"The text is required!"},
{"errorCode":"chat_15","status":"400","msg":"The contact is required!"},
{"errorCode":"chat_16","status":"400","msg":"Message ID is required!"},
{"errorCode":"chat_17","status":"400","msg":"Message not found!"},
{"errorCode":"chat_18","status":"400","msg":"Menu bot not found!"},
{"errorCode":"chat_19","status":"400","msg":"SectorId is required!"},
{"errorCode":"chat_20","status":"400","msg":"This channel do not use chatbot!"},

{"errorCode":"media_01","status":"400","msg":"'base64' or 'LinkUrl' is required"},
{"errorCode":"media_02","status":"400","msg":"Invalid extension, verify the format ex: .pdf, .jpg..."},
{"errorCode":"media_03","status":"400","msg":"can't download this file, check the link"},
{"errorCode":"media_04","status":"400","msg":"Invalid base64 string"},

{"errorCode":"comon_01","status":"400","msg":"the maximum number of cloning is 10x"},

{"errorCode":"scrpt_01","status":"400","msg":"id is required"},
{"errorCode":"scrpt_02","status":"400","msg":"script not found"},
{"errorCode":"scrpt_03","status":"400","msg":"script already locked"},
{"errorCode":"scrpt_04","status":"400","msg":"date to schedule is required"},
{"errorCode":"scrpt_05","status":"400","msg":"cron to schedule is required"},
{"errorCode":"scrpt_06","status":"400","msg":"scheduleScriptId is required"},
{"errorCode":"scrpt_07","status":"400","msg":"scheduleScript nout found"},
{"errorCode":"scrpt_08","status":"400","msg":"minutes to delay needs be greater than 0"},

{"errorCode":"tag_01","status":"400","msg":"id is required"},
{"errorCode":"tag_02","status":"400","msg":"Tag not found"},
{"errorCode":"tag_03","status":"400","msg":"Tag inactive"},
{"errorCode":"tag_04","status":"400","msg":"There is already a tag with this description"},

{"errorCode":"user_01","status":"400","msg":"User not found"},
{"errorCode":"user_02","status":"400","msg":"User inactive"},
{"errorCode":"user_03","status":"400","msg":"Invalid password"},
{"errorCode":"user_04","status":"400","msg":"This email is already in use"},
{"errorCode":"user_05","status":"400","msg":"Resale not found"},
{"errorCode":"user_06","status":"400","msg":"id is required"},

{"errorCode":"cont_01","status":"400","msg":"Contact ID is required!"},
{"errorCode":"cont_02","status":"400","msg":"Contact not found!"},
{"errorCode":"cont_03","status":"400","msg":"Contact inactive!"},
{"errorCode":"cont_04","status":"400","msg":"It is not possible to delete this contact, it has open chats"},
{"errorCode":"cont_05","status":"400","msg":"Need some channel connected to check number on whatsapp!"},
{"errorCode":"cont_06","status":"400","msg":"There is already a contact with this number !"},
{"errorCode":"cont_07","status":"400","msg":"OrganizationId of TAG is not a valid organization"},
{"errorCode":"cont_08","status":"400","msg":"Contact without access to the organization of any of the informed tags"},

{"errorCode":"channel_01","status":"400","msg":"This action does not support this type of channel"},

{"errorCode":"sector_01","status":"400","msg":"The sector ID is required!"},
{"errorCode":"sector_02","status":"400","msg":"The sector was not found!"},

{"errorCode":"quick_01","status":"400","msg":"The quick answer was not found!"},
{"errorCode":"quick_02","status":"400","msg":"The quick answer specified needs components to be sent!"},

{"errorCode":"card_01","status":"400","msg":"The action card specified was not found"},

{"errorCode":"schdl_01","status":"400","msg":"date to schedule is required"},
{"errorCode":"schdl_02","status":"400","msg":"schedule id is required"},
{"errorCode":"schdl_03","status":"400","msg":"scheduled id not found"},

{"errorCode":"wacloud_01","status":"400","msg":"WhatsApp Cloud API returned an error"},

{"errorCode":"backup_01","status":"400","msg":"Backup not found"},

{"errorCode":"fatal_01","status":"500","msg":"An internal error occurred in the application"},

{"errorCode":"group_01","status":"400","msg":"Error on create a group"},
{"errorCode":"group_02","status":"400","msg":"Error on get info from group"},
{"errorCode":"group_03","status":"400","msg":"Group not found by this id"},
]