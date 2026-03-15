using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class IntegerUpDownIndexValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null || !int.TryParse(value.ToString(), out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be an integer.");
		}
		if (result <= 0)
		{
			return new ValidationResult(isValid: false, "Provided value must be greater than 0.");
		}
		if (result > 500)
		{
			return new ValidationResult(isValid: false, "Provided value must be less than or equal to 500.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
