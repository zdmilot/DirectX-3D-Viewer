using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class LoadedTemplatePropertiesViewModel : ViewModelBase
{
	private string siteButtonText;

	private Template loadedTemplate;

	public RelayCommand LaunchSitesDialog { get; }

	public string SiteButtonText
	{
		get
		{
			return siteButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SiteButtonText), ref siteButtonText, value);
		}
	}

	public Template LoadedTemplate
	{
		get
		{
			return loadedTemplate;
		}
		set
		{
			if (loadedTemplate != null)
			{
				((ObservableObject)loadedTemplate).PropertyChanged -= LoadedTemplate_PropertyChanged;
			}
			((ObservableObject)this).Set<Template>((Expression<Func<Template>>)(() => LoadedTemplate), ref loadedTemplate, value);
			if (loadedTemplate != null)
			{
				((ObservableObject)loadedTemplate).PropertyChanged += LoadedTemplate_PropertyChanged;
			}
		}
	}

	public LoadedTemplatePropertiesViewModel()
	{
		//IL_006b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0075: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DisplayThisTemplate", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			LoadTemplate(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawTemplate", (Action<NotificationMessage>)delegate
		{
			TriggerTemplateRedraw();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisTemplate", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchSitesDialog = new RelayCommand((Action)ExecuteLaunchSitesDialog, false);
	}

	private void LoadTemplate(Labware labware)
	{
		LoadedTemplate = labware as Template;
		UpdateDialogButtonText();
	}

	private void ResetReferences()
	{
		LoadedTemplate = null;
	}

	private void TriggerTemplateRedraw()
	{
		loadedTemplate.TriggerRedraw();
	}

	private void ExecuteLaunchSitesDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Template Sites", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogTemplateSitesViewModel>(), loadedTemplate, 0.85, 0.67);
		if (flag.HasValue && flag == true)
		{
			UpdateDialogButtonText();
			ConfigFileReader.UpdateTemplateAssignedRackStatus(loadedTemplate);
			LoadedTemplate.TriggerRedraw();
		}
	}

	private void UpdateDialogButtonText()
	{
		if (loadedTemplate != null)
		{
			if (loadedTemplate.Sites.Count == 0)
			{
				SiteButtonText = "Add Sites";
			}
			else
			{
				SiteButtonText = (loadedTemplate.ReadOnly ? "View Sites" : "Edit Sites");
			}
		}
	}

	private void LoadedTemplate_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "ReadOnly")
		{
			UpdateDialogButtonText();
		}
	}
}
