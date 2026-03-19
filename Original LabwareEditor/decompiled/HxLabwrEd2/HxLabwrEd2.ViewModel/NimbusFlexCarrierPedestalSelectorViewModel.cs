using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Media.Imaging;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class NimbusFlexCarrierPedestalSelectorViewModel : ViewModelBase
{
	private NimbusCarrier nimbusCarrier;

	private SortedDictionary<string, SortedDictionary<string, Pedestal>> readInPedestals;

	private bool blockExecuteLoadPedestalModel;

	public ObservableCollection<PedestalSelector> PedestalSelectors { get; }

	public RelayCommand<object> LoadPedestalModel { get; }

	public RelayCommand<object> ResetSelector { get; }

	public NimbusFlexCarrierPedestalSelectorViewModel()
	{
		PedestalSelectors = new ObservableCollection<PedestalSelector>();
		LoadPedestalModel = new RelayCommand<object>((Action<object>)ExecuteLoadPedestalModel, false);
		ResetSelector = new RelayCommand<object>((Action<object>)ExecuteResetSelector, false);
		Messenger.Default.Register<FlexCarrierMessage>((object)this, (object)"SetNimbusFlexCarrierReferences", (Action<FlexCarrierMessage>)SetFlexCarrierReferences, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"GenerateNimbusPedestals", (Action<NotificationMessage>)delegate
		{
			GeneratePedestals();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ResetNimbusFlexCarrierReferences", (Action<NotificationMessage>)delegate
		{
			ResetFlexCarrierReferences();
		}, false);
	}

	~NimbusFlexCarrierPedestalSelectorViewModel()
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

	private void ExecuteLoadPedestalModel(object sender)
	{
		if (blockExecuteLoadPedestalModel)
		{
			return;
		}
		PedestalSelector pedestalSelector = sender as PedestalSelector;
		PedestalMessage pedestalMessage = new PedestalMessage(pedestalSelector.PedestalPosition, (pedestalSelector.Selected.Item1 == Pedestal.EmptyPedestal.Name) ? string.Empty : readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1].ModelFilePath);
		Messenger.Default.Send<GenericMessage<PedestalMessage>>(new GenericMessage<PedestalMessage>(pedestalMessage), (object)"UpdatePedestal");
		bool flag = false;
		foreach (PedestalSelector pedestalSelector2 in PedestalSelectors)
		{
			if (pedestalSelector2.Selected.Item1 != Pedestal.EmptyPedestal.Name)
			{
				flag = true;
				break;
			}
		}
		Messenger.Default.Send<GenericMessage<bool>>(new GenericMessage<bool>(flag), (object)"UpdateNimbusFlexRightButton");
	}

	private void ExecuteResetSelector(object sender)
	{
		PedestalSelector obj = sender as PedestalSelector;
		obj.Selected = obj.AvailablePedestals[0];
	}

	private void GeneratePedestals()
	{
		foreach (PedestalSelector pedestalSelector in PedestalSelectors)
		{
			if (pedestalSelector.Selected.Item1 != Pedestal.EmptyPedestal.Name)
			{
				nimbusCarrier.Pedestals[pedestalSelector.PedestalPosition - 1] = new Pedestal(readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1]);
			}
			else
			{
				nimbusCarrier.Pedestals[pedestalSelector.PedestalPosition - 1] = null;
			}
		}
	}

	private void SetFlexCarrierReferences(FlexCarrierMessage msg)
	{
		nimbusCarrier = msg.Carrier as NimbusCarrier;
		readInPedestals = msg.AvailablePedestals;
		PopulatePedestalComboBoxes();
	}

	private void ResetFlexCarrierReferences()
	{
		nimbusCarrier = null;
	}

	private void PopulatePedestalComboBoxes()
	{
		blockExecuteLoadPedestalModel = true;
		PedestalSelectors.Clear();
		for (int i = 0; i < nimbusCarrier.PedestalTypes.Count; i++)
		{
			List<Tuple<string, string, BitmapImage, string>> list = new List<Tuple<string, string, BitmapImage, string>>();
			list.Add(new Tuple<string, string, BitmapImage, string>(Pedestal.EmptyPedestal.Name, string.Empty, null, string.Empty));
			string[] array = nimbusCarrier.PedestalTypes[i].Split(',');
			foreach (string text in array)
			{
				foreach (KeyValuePair<string, Pedestal> item in readInPedestals[text])
				{
					list.Add(new Tuple<string, string, BitmapImage, string>(item.Value.Name, text, item.Value.Image, item.Value.PartNumber));
				}
			}
			PedestalSelectors.Add(new PedestalSelector(i + 1, list));
		}
		blockExecuteLoadPedestalModel = false;
	}
}
