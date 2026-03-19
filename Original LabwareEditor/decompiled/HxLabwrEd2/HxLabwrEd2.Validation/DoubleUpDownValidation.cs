using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DoubleUpDownValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null || !double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var _))
		{
			return new ValidationResult(isValid: false, "Provided value must be a number.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
