using System.Globalization;
using System.Linq;
using System.Windows.Controls;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Validation;

public class DataGridSiteIdColumnValidation : ValidationRule
{
	public DependencyObjectWrapper WrappedTemplate { get; set; }

	public DependencyObjectWrapper WrappedSelectedSite { get; set; }

	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string newId = value.ToString();
		if (string.IsNullOrEmpty(newId))
		{
			return new ValidationResult(isValid: false, "Site Label cannot be blank.");
		}
		if (WrappedTemplate != null && WrappedTemplate.WrappedObject != null)
		{
			if ((WrappedTemplate.WrappedObject as Template).Sites.Count((Site site) => site.Id == newId) > 0 && WrappedSelectedSite?.WrappedObject != null && (WrappedSelectedSite.WrappedObject as Site).Id != newId)
			{
				return new ValidationResult(isValid: false, "Site Label must be unique.");
			}
			newId = newId.Replace("_", string.Empty);
			if (!newId.All(char.IsLetterOrDigit))
			{
				return new ValidationResult(isValid: false, "Site Label must only contain alphanumeric and underscore characters.");
			}
		}
		return new ValidationResult(isValid: true, null);
	}
}
