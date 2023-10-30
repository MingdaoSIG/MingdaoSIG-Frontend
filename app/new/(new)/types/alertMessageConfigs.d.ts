import { SweetAlertOptions } from "sweetalert2";
/**
 * type for Pop-Up Message Configurations
 *
 * @interface TPopUpMessageConfigs
 * @property {SweetAlertOptions} titleError - Configuration for displaying an error message with a title.
 * @property {SweetAlertOptions} Success - Configuration for displaying a success message.
 * @property {SweetAlertOptions} PermissionError - Configuration for displaying an error related to permissions.
 * @property {SweetAlertOptions} OthersError - Configuration for displaying other types of errors not covered by the previous properties.
 */
export type TAlertMessageConfigs = {
  titleError: SweetAlertOptions;
  sigError: SweetAlertOptions;
  Success: SweetAlertOptions;
  PermissionError: SweetAlertOptions;
  OthersError: SweetAlertOptions;
};
