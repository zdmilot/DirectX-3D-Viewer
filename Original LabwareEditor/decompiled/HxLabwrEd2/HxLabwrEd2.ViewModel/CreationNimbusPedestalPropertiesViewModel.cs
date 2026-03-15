using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationNimbusPedestalPropertiesViewModel : ViewModelBase
{
	private Template loadedTemplate;

	public Template LoadedTemplate
	{
		get
		{
			return loadedTemplate;
		}
		set
		{
			((ObservableObject)this).Set<Template>((Expression<Func<Template>>)(() => LoadedTemplate), ref loadedTemplate, value);
		}
	}

	public RelayCommand FilePath { get; }

	public CreationNimbusPedestalPropertiesViewModel()
	{
		//IL_0088: Unknown result type (might be due to invalid IL or missing references)
		//IL_0092: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DisplayThisNimbusPedestal", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			LoadTemplate(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisNimbusPedestal", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawNimbusPedestal", (Action<NotificationMessage>)delegate
		{
			RedrawTemplate();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UpdateLabwareAndRedrawNimbusPedestal", (Action<NotificationMessage>)delegate
		{
			UpdateLabwareAndRedrawTemplate();
		}, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
	}

	~CreationNimbusPedestalPropertiesViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void LoadTemplate(Labware labware)
	{
		LoadedTemplate = labware as Template;
	}

	private void ResetReferences()
	{
		LoadedTemplate = null;
	}

	private void RedrawTemplate()
	{
		loadedTemplate?.TriggerRedraw();
	}

	private void UpdateLabwareAndRedrawTemplate()
	{
		if (loadedTemplate != null)
		{
			if (string.IsNullOrEmpty(loadedTemplate.Sites[0].Labware))
			{
				loadedTemplate.Sites[0].LabwareRelative = "";
			}
			else
			{
				loadedTemplate.Sites[0].LabwareRelative = loadedTemplate.Sites[0].Labware;
			}
			ConfigFileReader.UpdateTemplateAssignedRackStatus(loadedTemplate);
			loadedTemplate.TriggerRedraw();
		}
	}

	private void ExecuteFilePath()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Rectangular or Circular Rack|*.rck;*.crk";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			loadedTemplate.Sites[0].Labware = openFileDialog.FileName;
			if (string.IsNullOrEmpty(loadedTemplate.Sites[0].Labware))
			{
				loadedTemplate.Sites[0].LabwareRelative = "";
			}
			else
			{
				loadedTemplate.Sites[0].LabwareRelative = loadedTemplate.Sites[0].Labware;
			}
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"NiimbusPedestalPathScroll");
			ConfigFileReader.UpdateTemplateAssignedRackStatus(loadedTemplate);
			loadedTemplate.TriggerRedraw();
		}
		openFileDialog = null;
	}
}
