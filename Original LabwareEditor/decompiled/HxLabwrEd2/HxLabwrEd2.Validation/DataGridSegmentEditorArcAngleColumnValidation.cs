using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DataGridSegmentEditorArcAngleColumnValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null)
		{
			return new ValidationResult(isValid: false, "The arc angle cannot be null.");
		}
		string text = value.ToString();
		if (string.IsNullOrEmpty(text))
		{
			return new ValidationResult(isValid: false, "The arc angle cannot be blank.");
		}
		if (!double.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be a number.");
		}
		if (result > 360.0 || result < 1.0)
		{
			return new ValidationResult(isValid: false, $"The arc angle must be between {1} and {360} degrees.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
