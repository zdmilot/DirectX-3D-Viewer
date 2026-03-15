using System;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class DialogTemplateSitesViewModel : DialogViewModelBase
{
	private Template templatePartialDuplicate;

	private Template loadedTemplate;

	private Site selectedSite;

	public Template TemplatePartialDuplicate
	{
		get
		{
			return templatePartialDuplicate;
		}
		set
		{
			if (templatePartialDuplicate != null)
			{
				templatePartialDuplicate.Sites.CollectionChanged -= Sites_CollectionChanged;
			}
			((ObservableObject)this).Set<Template>((Expression<Func<Template>>)(() => TemplatePartialDuplicate), ref templatePartialDuplicate, value);
			if (templatePartialDuplicate != null)
			{
				templatePartialDuplicate.Sites.CollectionChanged += Sites_CollectionChanged;
			}
		}
	}

	public Site SelectedSite
	{
		get
		{
			return selectedSite;
		}
		set
		{
			if (selectedSite != null)
			{
				((ObservableObject)selectedSite).PropertyChanged -= SelectedSite_PropertyChanged;
			}
			((ObservableObject)this).Set<Site>((Expression<Func<Site>>)(() => SelectedSite), ref selectedSite, value);
			if (selectedSite != null)
			{
				((ObservableObject)selectedSite).PropertyChanged += SelectedSite_PropertyChanged;
			}
		}
	}

	public RelayCommand AddSite { get; }

	public RelayCommand RemoveSite { get; }

	private void ExecuteAddSite()
	{
		Site site = new Site(Site.FindNextDefaultLabel(TemplatePartialDuplicate.Sites));
		TemplatePartialDuplicate.Sites.Add(site);
		Messenger.Default.Send<GenericMessage<object>>(new GenericMessage<object>((object)site), (object)"AddSiteUI");
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void ExecuteRemoveSite()
	{
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_003b: Expected O, but got Unknown
		TemplatePartialDuplicate.Sites.Remove(SelectedSite);
		base.SaveButton.RaiseCanExecuteChanged();
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RefreshSitesGrid");
	}

	public DialogTemplateSitesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_0038: Unknown result type (might be due to invalid IL or missing references)
		//IL_0042: Expected O, but got Unknown
		//IL_0050: Unknown result type (might be due to invalid IL or missing references)
		//IL_005a: Expected O, but got Unknown
		//IL_0068: Unknown result type (might be due to invalid IL or missing references)
		//IL_0072: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, (Func<bool>)CanExecuteSaveButton, false);
		AddSite = new RelayCommand((Action)ExecuteAddSite, false);
		RemoveSite = new RelayCommand((Action)ExecuteRemoveSite, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogTemplateSitesSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogTemplateSitesViewModel()
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

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		loadedTemplate = loadedLabware as Template;
		TemplatePartialDuplicate = new Template();
		TemplatePartialDuplicate.ReadOnly = loadedTemplate.ReadOnly;
		TemplatePartialDuplicate.LabwareFileFullPath = loadedTemplate.LabwareFileFullPath;
		foreach (Site site in loadedTemplate.Sites)
		{
			TemplatePartialDuplicate.Sites.Add(new Site(site));
		}
		if (templatePartialDuplicate.Sites.Count > 0)
		{
			SelectedSite = templatePartialDuplicate.Sites[0];
		}
		TemplatePartialDuplicate.DataChanged = false;
	}

	private void SelectedSite_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "Labware")
		{
			Site site = sender as Site;
			if (string.IsNullOrWhiteSpace(site.Labware))
			{
				site.LabwareRelative = "";
			}
			else if (string.IsNullOrEmpty(TemplatePartialDuplicate.LabwareFileFullPath))
			{
				site.LabwareRelative = site.Labware;
			}
			else
			{
				site.LabwareRelative = PathHelper.GenerateNewRelativePath(site.Labware, site.LabwareRelative, TemplatePartialDuplicate.LabwareFileFullPath);
			}
			SelectedSite = site;
		}
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void Sites_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.Action == NotifyCollectionChangedAction.Remove)
		{
			base.SaveButton.RaiseCanExecuteChanged();
		}
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		loadedTemplate = null;
		TemplatePartialDuplicate = null;
		SelectedSite = null;
	}

	private void ExecuteSaveButton()
	{
		loadedTemplate.Sites = templatePartialDuplicate.Sites;
		int num = 0;
		int num2 = 1;
		while (num < loadedTemplate.Sites.Count)
		{
			loadedTemplate.Sites[num].Position = num2;
			num++;
			num2++;
		}
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		loadedTemplate = null;
		TemplatePartialDuplicate = null;
		SelectedSite = null;
	}

	private bool CanExecuteSaveButton()
	{
		if (templatePartialDuplicate != null && templatePartialDuplicate.DataChanged && templatePartialDuplicate.Sites != null && templatePartialDuplicate.Sites.Count > 0)
		{
			return true;
		}
		return false;
	}
}
