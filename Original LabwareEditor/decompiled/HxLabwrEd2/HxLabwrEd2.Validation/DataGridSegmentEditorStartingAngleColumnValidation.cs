using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DataGridSegmentEditorStartingAngleColumnValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null)
		{
			return new ValidationResult(isValid: false, "The starting angle cannot be null.");
		}
		string text = value.ToString();
		if (string.IsNullOrEmpty(text))
		{
			return new ValidationResult(isValid: false, "The starting angle cannot be blank.");
		}
		if (!double.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be a number.");
		}
		if (result > 360.0 || result < 0.0)
		{
			return new ValidationResult(isValid: false, $"The starting angle must be between {0} and {360} degrees.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
