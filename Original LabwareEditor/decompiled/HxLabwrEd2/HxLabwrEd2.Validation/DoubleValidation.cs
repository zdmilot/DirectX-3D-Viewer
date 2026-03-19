using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DoubleValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (string.IsNullOrEmpty(value.ToString()))
		{
			return new ValidationResult(isValid: false, "No value assigned.");
		}
		if (!double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var _))
		{
			return new ValidationResult(isValid: false, "Provided value is not a number.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
