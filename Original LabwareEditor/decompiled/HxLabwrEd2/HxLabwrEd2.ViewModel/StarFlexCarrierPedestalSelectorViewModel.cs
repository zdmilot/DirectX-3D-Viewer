using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Media.Imaging;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class StarFlexCarrierPedestalSelectorViewModel : ViewModelBase
{
	private StarCarrier starCarrier;

	private SortedDictionary<string, SortedDictionary<string, Pedestal>> readInPedestals;

	private bool blockExecuteLoadPedestalModel;

	private bool blockModelLoading;

	public ObservableCollection<PedestalSelector> PedestalSelectors { get; }

	public Dictionary<int, List<int>> OversizedPedestals { get; }

	public RelayCommand<object> LoadPedestalModel { get; }

	public RelayCommand<object> ResetSelector { get; }

	public StarFlexCarrierPedestalSelectorViewModel()
	{
		OversizedPedestals = new Dictionary<int, List<int>>();
		PedestalSelectors = new ObservableCollection<PedestalSelector>();
		LoadPedestalModel = new RelayCommand<object>((Action<object>)ExecuteLoadPedestalModel, false);
		ResetSelector = new RelayCommand<object>((Action<object>)ExecuteResetSelector, false);
		Messenger.Default.Register<FlexCarrierMessage>((object)this, (object)"SetStarFlexCarrierReferences", (Action<FlexCarrierMessage>)SetFlexCarrierReferences, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"GenerateStarPedestals", (Action<NotificationMessage>)delegate
		{
			GeneratePedestals();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ResetStarFlexCarrierReferences", (Action<NotificationMessage>)delegate
		{
			ResetFlexCarrierReferences();
		}, false);
	}

	~StarFlexCarrierPedestalSelectorViewModel()
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
		if (pedestalSelector.Selected == null || pedestalSelector.Selected.Item1.Contains("blocked"))
		{
			return;
		}
		HandleOversizedPedestals(pedestalSelector);
		PedestalOffsetsMessage pedestalOffsetsMessage = new PedestalOffsetsMessage(pedestalSelector.PedestalPosition, (pedestalSelector.Selected.Item1 == Pedestal.EmptyPedestal.Name) ? 0f : ((float)readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1].ModelOffsetsOverride.X), (pedestalSelector.Selected.Item1 == Pedestal.EmptyPedestal.Name) ? 0f : ((float)readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1].ModelOffsetsOverride.Y));
		Messenger.Default.Send<GenericMessage<PedestalOffsetsMessage>>(new GenericMessage<PedestalOffsetsMessage>(pedestalOffsetsMessage), (object)"UpdatePedestalOffsets");
		PedestalMessage pedestalMessage = new PedestalMessage(pedestalSelector.PedestalPosition, (pedestalSelector.Selected.Item1 == Pedestal.EmptyPedestal.Name) ? string.Empty : readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1].ModelFilePath, !blockModelLoading);
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
		Messenger.Default.Send<GenericMessage<bool>>(new GenericMessage<bool>(flag), (object)"UpdateStarFlexRightButton");
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
				starCarrier.Pedestals[pedestalSelector.PedestalPosition - 1] = new Pedestal(readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1]);
			}
			else
			{
				starCarrier.Pedestals[pedestalSelector.PedestalPosition - 1] = null;
			}
		}
	}

	private void SetFlexCarrierReferences(FlexCarrierMessage msg)
	{
		starCarrier = msg.Carrier as StarCarrier;
		readInPedestals = msg.AvailablePedestals;
		PopulatePedestalComboBoxes();
	}

	private void ResetFlexCarrierReferences()
	{
		starCarrier = null;
	}

	private void PopulatePedestalComboBoxes()
	{
		blockExecuteLoadPedestalModel = true;
		PedestalSelectors.Clear();
		for (int i = 0; i < starCarrier.PedestalTypes.Count; i++)
		{
			List<Tuple<string, string, BitmapImage, string>> list = new List<Tuple<string, string, BitmapImage, string>>();
			list.Add(new Tuple<string, string, BitmapImage, string>(Pedestal.EmptyPedestal.Name, string.Empty, null, string.Empty));
			string[] array = starCarrier.PedestalTypes[i].Split(',');
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

	private void HandleOversizedPedestals(PedestalSelector pedestalSelector)
	{
		blockModelLoading = true;
		int num = PedestalSelectors.IndexOf(pedestalSelector);
		if (OversizedPedestals.ContainsKey(num))
		{
			foreach (int item in OversizedPedestals[num])
			{
				PedestalSelectors[item].UnblockSelector();
			}
			OversizedPedestals.Remove(num);
		}
		if (pedestalSelector.Selected.Item1 != Pedestal.EmptyPedestal.Name)
		{
			Pedestal pedestal = readInPedestals[pedestalSelector.Selected.Item2][pedestalSelector.Selected.Item1];
			if (pedestal.Oversized.Count > 0)
			{
				List<int> list = new List<int>();
				foreach (int item2 in pedestal.Oversized)
				{
					list.Add(num + item2);
				}
				if (OversizedPedestals.Count > 0)
				{
					List<int> list2 = new List<int>();
					foreach (KeyValuePair<int, List<int>> oversizedPedestal in OversizedPedestals)
					{
						if (oversizedPedestal.Value.Select((int x) => x).Intersect(list).Any() || list.Contains(oversizedPedestal.Key))
						{
							list2.Add(oversizedPedestal.Key);
						}
					}
					if (list2.Count > 0)
					{
						foreach (int item3 in list2)
						{
							PedestalSelectors[item3].Selected = PedestalSelectors[item3].AvailablePedestals[0];
						}
					}
				}
				foreach (int item4 in list)
				{
					if (PedestalSelectors[item4] != null)
					{
						PedestalSelectors[item4].Selected = PedestalSelectors[item4].AvailablePedestals[0];
						PedestalSelectors[item4].BlockSelector(pedestalSelector.PedestalPosition);
					}
				}
				OversizedPedestals.Add(num, list);
			}
		}
		blockModelLoading = false;
	}
}
