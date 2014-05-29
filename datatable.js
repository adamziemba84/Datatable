(function($){
	
	var MainDataTable = function(dataTable, options)
	{
		// Datatable
		var $table = $(dataTable);
	    var thisObject = this;
	    
		// Merge options with defaults
		var settings = $.extend({
			dataResult: {},		
			rows: 10,
			page: 1,
			totalResult: 0,
			totalColumns: '',
			lastColumnSord: '', // kolumn po ktorej ostatnio sortowania
			lastSord: 0, // znacznik ostatniego kierunku sortowania
			filtersToolbar : {}, //filtry toolbara
			defaultFilterName : 'equal',
			defaultOptionFilterSelect: 'Wybierz',
			multiSelectCheckbox: '<input class="form-control" type="checkbox" style="height: 20px !important;" />',
			expandSubDataTable: '<span class="glyphicon glyphicon-plus"></span>',
			collapseSubDataTable: '<span class="glyphicon glyphicon-minus"></span>',
		}, options || {});

		// Public method
	    this._init = function(setPage, row_per_page, sidx, sord, filters)
	    {
	    	// Panel
	    	(settings.panel) ? thisObject.panel() : '';
	    	
	    	// Wyliczenie calkowitej ilsoci kolumn
	    	thisObject.totalColumns();
	    	
	    	// Naglowki kolumn
	    	thisObject.headerColumn();
	    	
	    	// Header
	    	(settings.caption != false && settings.panel == false) ? thisObject.header() : '';
	    	
	    	// Toolbar
			(settings.filterToolbar == true) ? thisObject.toolbar(settings.filtersToolbar) : '';
			
			// Style
			thisObject.setStyles();
			
			// Parameters
			//(settings.parameters != false) ? thisObject.parameters() : '';
			
	    	// Ładowanie danych przez ajax
	    	var loadDataFromAjax = thisObject.loadDataFromAjax(setPage, row_per_page, sidx, sord, filters);
	    	
	    	// Obsługa metody Success
	    	loadDataFromAjax.success(function (data) {
	    		
	    		// Success			
				thisObject.createCells(data.rows);
				
				// Paginacja
				thisObject.pagination(data);
				
				//
				thisObject.refreshButton();
								
				// Selected 
				$table.next('#'+settings.footerName).find('#row_per_page').children('option[value="'+data.limit+'"]').attr('selected', true);				
			});
	    	
	    	loadDataFromAjax.error(function (data) {
				// Error
			});	    
			
			// Po wczytaniu danych
			loadDataFromAjax.done(function (data) {
				
				// Usuniecie paska ladowania				
				$table.find('#progressBar').remove();
				
				// Info o braku danych
				thisObject.emptyRows(data.rows);
								
				// Multiselect
				(settings.multiselect) ? thisObject.multiSelect() : '';
								
				
				// Col risize
				/*
				$table.colResizable({
					disable: (settings.colResize == true) ? false : true,
					liveDrag:true, 
					draggingClass:"", 
					gripInnerHtml:"<div class='foodGrip'></div>",
				});
				*/
				
				// Obsluga zmiany szerokosci kolumn
				if (settings.colResize)
				{
					$table.resizableColumns({
            			//store: store
          			});
				}
				
				// Obsluga wyswietlania kolumn
				thisObject.showHideColumns();
				
				// Obsluga opcji kolumn
				thisObject.headerColumnOptions();
		
				// Ikona kierunku sortowania
				thisObject.setIconSort();
				
				// Sub grid
				(settings.subDataTable == true ) ? thisObject.subDataTable() : '';
				
				// Ilosc wybranych elementow
				thisObject.countParameters();
				
				// Box filters
				thisObject.pillBoxFilters();
				
				// Ustawienie szerokosci kolumn
				//thisObject.setWidthColumn();
				
				// Footer
				(settings.footer.length > 0) ? thisObject.footer() : '';
				
				// call the callback and apply the scope:
    			settings.afterLoadCallback.call(this);
			});	  		    		    		
		};
		
		this.panel = function()
		{
			// Obsluga wyswietlania kolumn
			var shodHideColumns = '<div class="pull-right">'+thisObject.showHideColumnsForm()+'</div>';
			
			var filterTypes = '<li><a href="#">Action</a></li><li><a href="#">Another action</a></li><li><a href="#">Something else here</a></li><li class="divider"></li><li><a href="#">Separated link</a></li>';
			
			//console.log($('#'+settings.parameters['nameFilterForm']).parent().html());
			
			var formContent = $('#'+settings.parameters['nameFilterForm']).parent().html();
			
			var filterBtn = '<div id="filterOptions" class="btn-group"><button type="button" class="btn btn-primary btn-xs dropdown-toggle" data-toggle="dropdown"><span class="glyphicon glyphicon-filter"></span>&nbsp;Wybierz filtry<span class="caret"></span></button><ul class="dropdown-menu" role="menu"><span style="margin-left: 10px; font-size: 12px;" class="">Filtr listy:</span>'+formContent+'</ul></div>';
			
			var filterPillbox = '<div class="filterPillbox"></div>';
			
			var parameters = filterPillbox;
			

			// Ustawianie naglowka
			$('#table_panel_'+settings.nameMain).find('#rightTablePanel').html(shodHideColumns);
			
			$('#table_panel_'+settings.nameMain).find('#table_functions').html(parameters);
									
			// Zatryzmanie zamykania							
			$('#filterOptions .dropdown-menu').click(function(e){				
								
				e.stopPropagation();
				
			});	
			
			$('#filterOptions').on('show.bs.dropdown', function () {
			  // do something…
			  
			  //$('#filterOptions .dropdown-menu').html('<span style="margin-left: 10px; font-size: 12px;" class="">Filtr listy:</span>'+formContent);
			  
			  
			});

			
		};
		
		this.footer = function()
		{
			var lastRow = $table.find('tbody').children('tr').last();
			var models = settings.colModel; // Modele kolumn    	
           	var modelsCount = models.length; // Ilosc
           	var displayValue = '';
           	
			footerRow = '<tr>';
			
			for (var i in models) {
				
				var value = settings.footer[0][models[i].name];
								
				if (typeof(value) == 'boolean' && value) {
					displayValue = thisObject.autoSumColumn(models[i].name);
				}
				
				if (typeof(value) == 'string') {
					displayValue = value;
				}				
				
				footerRow += '<td column-name="'+models[i].name+'">'+displayValue+'</td>';
				
				// Czyszczenie
				displayValue = '';
				
			}
			
			footerRow += '</tr>';
			
			lastRow.after(footerRow);
			
		};
		
		this.autoSumColumn = function(columnName)
		{
			var sumNumberValues = 0;
			
			$table.find('tbody').children('tr.mainRow').each(function() {
			  
			  var value = $(this).find('td').filter('[column-name="'+columnName+'"]').text();
			  
			  value = parseFloat(value);			  
			  sumNumberValues += value;				  
			});
			
			// Suma liczb w kolumnie
			return sumNumberValues;
		};
		
		this.doubleClick - function()
		{
			// Obsluga glownego multiselecta
			$table.find('tbody#main tr.mainRow th:eq('+eq+') input[type="checkbox"]').click(function() {
				
				// Stan zaznaczenia
				var is_checked = $(this).is(':checked');
		
				// Jesli zaznaczony glowny to zaznacz wszystkie pozostale				
				$table.find('tbody tr').each(function(index) {
					$(this).find('td:eq('+eq+') input[type="checkbox"]').each(function(index) {
						(is_checked) ? $(this).attr('checked', true) : $(this).attr('checked', false);
					});
				});				
				
			});	
			
		};
		
		/**
		 * Ustawienia styli listy oraz opcji wyswietlania 
		 */
		this.setStyles = function() 
		{
			// Opcje Wyswietlania
			(settings.optionDisplay['condensed']) ? $table.addClass('table-condensed') : '';
	        (settings.optionDisplay['bordered']) ? $table.addClass('table-bordered') : '';
	        (settings.optionDisplay['striped']) ? $table.addClass('table-striped') : '';
	        (settings.optionDisplay['hover']) ? $table.addClass('table-hover') : '';
	        
			
			// Styl podstawowy
	        if (settings.style === 'basic') {
	        	
	        	$table.find('thead').css('background-color', '#fff');
	        	
	        	// Jesli nie ma headera
	        	( ! settings.caption) ? $table.css('border-radius', '4px') : '';      	
	        }
	        
	        // Styl dla rozszerzonego
	        if (settings.style === 'extended') {
	        	$table.find('thead').css('background-color', '#F5F5F5');	        	
	        }
	        
		};
		
		this.setWidthColumn = function() 
		{
			var columnWidth = 0;
						
			$(window).resize(function() {
				
				var lengthCol = $table.find('thead tr td').length;
				var startColumn = 0;
				
				// Jesli wlaczony multiselect
				if (settings.multiselect == true) {
					//lengthCol--;
					//startColumn++;
				}	
				
				//console.log(startColumn);
				
				for (var i = startColumn; i < lengthCol; i++) {
					
					console.log(i);
					
					//$table.find('thead tr td:eq('+i+') input[type="text"]').width(0);
					//$table.find('thead tr td:eq('+i+') select').width(0);
					
					var ele = $table.find('thead tr th:eq('+i+')');
					
					//console.log(ele.width());
					
					$table.find('thead tr td:eq('+i+')').width(ele.width());
					//$table.find('thead tr td:eq('+i+') input[type="text"]').width(ele.width());
					//$table.find('thead tr td:eq('+i+') select').width(ele.width());
					
					//$table.find('thead tr td:eq('+i+') .toolbarSelect').width(ele.width());
					
				}
				
				console.log('end');
				
			}).trigger('resize');
			
			
		};
		
		// Info o braku danych
		this.emptyRows = function(rows) 
		{
			// Colspan
	    	var colSpan = settings.totalColumns;
	    	
	    	// Jesli multiselect wlaczony 
			(settings.multiselect) ? colSpan++ : '';
			    
			// Jesli subgridy wlaczone
			(settings.subDataTable) ? colSpan++ : '';
			
			var emptyData = '<tr id="emptyData"><td colspan="'+colSpan+'"> <div><span class="label label-danger">Brak danych</span></div>  </td></tr>';
	    		
	    	// Umieszczenie paska
	    	(rows.length === 0) ? $table.find('thead').after(emptyData) : '';
		};
		
		this.multiSelect = function()
		{			
			var eq = 0;
			
			// Jesli subgridy wlaczone
			(settings.subDataTable) ? eq++ : '';
						
			// Obsluga glownego multiselecta
			$table.find('thead#main tr.mainRow th:eq('+eq+') input[type="checkbox"]').click(function() {
				
				// Stan zaznaczenia
				var is_checked = $(this).is(':checked');
		
				// Jesli zaznaczony glowny to zaznacz wszystkie pozostale				
				$table.find('tbody tr').each(function(index) {
					$(this).find('td:eq('+eq+') input[type="checkbox"]').each(function(index) {
						(is_checked) ? $(this).attr('checked', true) : $(this).attr('checked', false);
					});
				});				
				
			});			
		};
		
		// Zwraca ID zaznaczonych wierszy przez multiselect
		this.getSelectedRow = function()
		{
			// Tablcia odentyfikatorow
			var rowIds = new Array();
			var i = 0;
			var eq = 0;
	
			// Jesli wlaczone subgridy
			(settings.subDataTable) ? eq++ : '';
	
			// Przejscie po wierszach
			$table.find('tbody tr').each(function(index) {
				
				// Checkbox
				$(this).find('td:eq('+eq+') input[type="checkbox"]').each(function(index) {
					
					var is_checked = $(this).is(':checked');
					
					// Jesli zaznaczony to pobierz ID
					if (is_checked) {
						
						var id = $(this).parents('tr').attr('id');
						
						rowIds[i] = parseInt(id);
						
						i++;
					}
				});
			});
			
			return rowIds;
		};
		
		this.totalColumns = function()
		{
			// Jesli wlaczony multiselect to plus 1
			(settings.multiselect) ? settings.totalColumns = settings.colNames.length + 1 : settings.totalColumns = settings.colNames.length;
		};
		
		this.header = function()
		{				
			var showHideColumns = (settings.showHideColumns) ? this.showHideColumnsForm() : '';
			
			var headerContent = '<div id="headerContent"><span id="headerCaption" >'+settings.caption+'</span><span id="showHideColumns" >'+showHideColumns+'</span></div>';			
			
			// Jesli istnieje to usun i wstaw
			($('#headerContent').length == 0) ? $table.before(headerContent) : '';
			
			// Jesli istnieje subgrid
			(settings.subDataTable == true) ? $table.find('table').before(headerContent) : '';
		};
		
		// Przygotowanie listy kolumn z checkboxami
		this.showHideColumnsForm = function()
		{	
			var names = settings.colNames; // Nazwy kolumn    	
            var colCount = names.length; // Ilosc kolumn
            var columns = ''; // String z html-em
            
            // Dopisywanie kolumn do zmiennej
            for (var i = 0; i < colCount; i++) {
            	
            	if (settings.colModel[i]['visible']) {
            		//columns += '<li><label class="checkbox" >'+names[i]+'<input type="checkbox" checked="checked" value="'+i+'" ></label></li>';
            		columns += '<li><label class="checkbox" >'+names[i]+'<input type="checkbox" checked="checked" column-index="'+i+'" value="'+settings.colModel[i]['name']+'" ></label></li>';            		
            	}
            	else {
            		//columns += '<li><label class="checkbox" >'+names[i]+'<input type="checkbox" value="'+i+'" ></label></li>';
            		columns += '<li><label class="checkbox" >'+names[i]+'<input type="checkbox" column-index="'+i+'" value="'+settings.colModel[i]['name']+'" ></label></li>';            		
            	}	            	
            }
            
            // Formularz listy kolumn
            return '<div class="btn-group"><button class="btn btn-default btn-xs"><span class="glyphicon glyphicon-cog"></span> Widoczność kolumn </button><button class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu">'+columns+'</ul></div>';
		};
		
		// Obsluga ukrywania i wyswietlania kolumn
		this.showHideColumns = function()
		{
			var parentElement = (settings.panel) ? '.panel' : '#showHideColumns';
			
			// Obsluga
			$(parentElement+' .dropdown-menu li').click(function(e) {
				
				// Zapobieganie automatycznemu zamykaniu dropdown przy klikniecie
			    e.stopPropagation();				    
			    
			    var models = settings.colModel; // Modele kolumn
			    var $checkbox = $(this).find('input[type="checkbox"]');
			    
			    var colIndex = $checkbox.attr('column-index');
			    var colName = $checkbox.val();			    
			    var colModelIndex = 0;
			    var groupName = '';
			    var groupColspan = 0;			    
			    var $groupHeader = '';		    
			    			    
			    // Tylko jesli wysylana jest glowna lista
				if (settings.name === settings.nameMain) {			    
			    
					// Jesli multiselect wlaczony 
					(settings.multiselect) ? colIndex++ : '';
					    
					// Jesli subgridy wlaczone
					(settings.subDataTable) ? colIndex++ : '';
					    			    
					// Jesli multiselect wlaczony to indeks colModel zwiekszyc
					(settings.multiselect) ? colModelIndex++ : '';
					    
					// Jesli subgridy wlaczony to indeks colModel zwiekszyc
					(settings.subDataTable) ? colModelIndex++ : '';
							    			      
				    // Jesli zaznaczony
				    if ($checkbox.is(':checked')) {
				    	
				    	$('#'+settings.nameMain+' #main .mainRow th[column-name="'+colName+'"]').show();
						$('#'+settings.nameMain+' #main .mainRow td[column-name="'+colName+'"]').show();
						
						// Nazwa grupy								
						groupName = $('#'+settings.nameMain+' #main .mainRow th[column-name="'+colName+'"]').attr('group-name');
							
						// Html grupy
						$groupHeader = $('#'+settings.nameMain+' #main .headerTop th[group-name="'+groupName+'"]');	
							
						// Aktualmy colspan
						groupColspan = $groupHeader.attr('colspan');
						
						// Dekrementacja o jeden
						groupColspan++;
						
						// Zmiana wartosci colspan
						$groupHeader.attr('colspan', groupColspan);		
						
						// Jesli ma wyswietlac
						if (groupColspan > 0)
						{	
							// Wlaczenie wyswietlania
							$groupHeader.show();							
						}

						// Zapis wartosci do atrybutu
						settings.colModel[colIndex - colModelIndex]['visible'] = true;						
					}
					else {
									    
				    	$('#'+settings.nameMain+' #main .mainRow th[column-name="'+colName+'"]').hide();
						$('#'+settings.nameMain+' #main .mainRow td[column-name="'+colName+'"]').hide();
						
						// Nazwa grupy								
						groupName = $('#'+settings.nameMain+' #main .mainRow th[column-name="'+colName+'"]').attr('group-name');
							
						// Html grupy
						$groupHeader = $('#'+settings.nameMain+' #main .headerTop th[group-name="'+groupName+'"]');	
							
						// Aktualmy colspan
						groupColspan = $groupHeader.attr('colspan');
						
						// Dekrementacja o jeden
						groupColspan--;
						
						// Zmiana wartosci colspan
						$groupHeader.attr('colspan', groupColspan);
							
						// Jesli ma wyswietlac
						if (groupColspan == 0)
						{	
							// Wylaczenie wyswietlania
							$groupHeader.hide();
						}			

						// Zapis wartosci do atrybutu
						settings.colModel[colIndex - colModelIndex]['visible'] = false;	
					}
				}
			
				
			});
		};
			    
	    // Ładowanie nazw kolumn
		this.headerColumn = function()
        {        	           	
        	var names = settings.colNames; // Nazwy kolumn    	
        	var models = settings.colModel; // Modele kolumn
            var colCount = names.length; // Ilosc kolumn
            var name = '';
            
            var th = '';
            var th_top = ''; // String z html-em
            var th_bottom = ''; // String z html-em
            
            var tr_top = '';
            var tr_bottom = '';
            
            var main = ''; // Nazwa id dla thead jesli glowna lista
            var mainRow = '';
                        
            var numberOfColumns = 0;         
            var nextStepColumn = 0;                        
            var current_group_name = '';
            var groupTitle = '';
            
            (settings.multiselect && settings.groupHeaders != false) ? th_bottom = '<th></th>' : '';
            (settings.subDataTable && settings.groupHeaders != false) ? th_bottom += '<th></th>' : '';
            
            // Jesli podano konfiguracje dla groupheadera
            if (settings.groupHeaders != false)
            {            	
            	// Pobieranie kolumn
	            for (var i = 0; i < colCount; i++) {
	            	
	            	// Nazwa kolumny
	            	name = models[i]['name'];	            	
	            	
	            	for (var j in settings.groupHeaders) {
	            		
	            		if (name === settings.groupHeaders[j].startColumnName ) {
	            			
	            			current_group_name = settings.groupHeaders[j].startColumnName;
	            			is_group = true;
	            			numberOfColumns = settings.groupHeaders[j].numberOfColumns;
	            			nextStepColumn = settings.groupHeaders[j].numberOfColumns;
	            			groupTitle = settings.groupHeaders[j].titleText;
	            		}
	            		
	            	}
	            			            		
	           		// Opcje kolumny | sortowanie itp
	           		var options = thisObject.headerColumnOptionsForm(name, models[i]['sortable']);
	            	
		           	// Jesli sortable = true
		           	if (models[i]['sortable'] == true) {
		           		var nameLink = '<a id="sortColumn" href="" name-column="'+name+'" >'+names[i]+'</a>';
		           	}
		           	else {
		           		var nameLink = names[i];
		           	}  	            		
	            			
	            			            		
	           		// Jesli aktualnie pobrana kolumna znajduje sie w konfiguracji groupheadera
	           		if (name === current_group_name || nextStepColumn != 0) {
	            				            			
		           		// Jesli visible kolumny = true to wyswietlaj
			            if (models[i]['visible'] == true) {
			            		
			            	if (nextStepColumn == numberOfColumns)
			            	{
			            		th_top += '<th colspan="'+numberOfColumns+'" group-name="'+current_group_name+'" width="'+models[i]['width']+'%" ><span class="nameColumn">'+groupTitle+'</span></th>';
			            	}
			            		
			            	th_bottom += '<th column-name="'+name+'" group-name="'+current_group_name+'" width="'+models[i]['width']+'%" ><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+options+'</span></th>';
			            		
			            }
			            // Jesli visible kolumny = true to niewyswietlaj
			            else {
				            		
			           		if (nextStepColumn == numberOfColumns)
			           		{
			           			th_top += '<th column-name="'+name+'" group-name="'+current_group_name+'" style="display: none;"><span class="nameColumn">'+groupTitle+'</span><span id="colOptions">'+options+'</span></th>';
			           		}
				            					            		
			           		th_bottom += '<th column-name="'+name+'" group-name="'+current_group_name+'" style="display: none;"><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+options+'</span></th>';
			           	}
			            	
			    		// Zmniejszenie kroku
	           			nextStepColumn--;	            			
	            	}
	            	else   
	            	{		            			
	            		// Jesli visible kolumny = true to wyswietlaj
			           	if (models[i]['visible'] == true) {			            	
			           		th_top += '<th column-name="'+name+'" rowspan="2" width="'+models[i]['width']+'%" ><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+options+'</span></th>';			            		
			           	}
			           	// Jesli visible kolumny = true to niewyswietlaj
			           	else {			            		
			           		th_top += '<th column-name="'+name+'" style="display: none;"><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+groupTitle+'</span></th>';			            		
			           	}   			
	            	}	            		

	            	            	
	            }            
            }
            
            else
            {            
	            // Dopisywanie kolumn do zmiennej
	            for (var i = 0; i < colCount; i++) {
	            	
	            	// Nazwa kolumny
	            	name = models[i]['name'];
	            	
	            	// Opcje kolumny
	            	var options = thisObject.headerColumnOptionsForm(name, models[i]['sortable']);
	            	
	            	// Jesli sortable = true
	            	if (models[i]['sortable'] == true) {
	            		var nameLink = '<a id="sortColumn" href="" name-column="'+name+'" >'+names[i]+'</a><i></i>';
	            	}
	            	else {
	            		var nameLink = names[i];
	            	}            	
	            	            	
	            	// Jesli visible kolumny = true to wyswietlaj
	            	if (models[i]['visible'] == true) {
	            		th += '<th column-name="'+name+'" width="'+models[i]['width']+'%" ><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+options+'</span></th>';
	            	}
	            	// Jesli visible kolumny = true to niewyswietlaj
	            	else {
	            		th += '<th column-name="'+name+'" style="display: none;"><span class="nameColumn">'+nameLink+'</span><span id="colOptions">'+options+'</span></th>';
	            	}
	            	     	
	            }
            
            }
            
            // Tylko jesli wysylany jest glowna lista
			(settings.name === settings.nameMain) ? main = 'id="main"' : ''; 
			(settings.name === settings.nameMain) ? mainRow = 'class="mainRow labels"' : '';			

			
			tr_top = '<tr class="mainRow headerTop" >'+th_top+'</tr>';
			
			tr_bottom = '<tr class="mainRow headerBottom">'+th_bottom+'</tr>';
			
			
            if (settings.groupHeaders != false)
            {  
	            // Wstawianie sekcji kolumn do tabeli
    	        $table.html('<thead '+main+'>'+tr_top+''+tr_bottom+'</thead>');
        	}
        	else {        		
        		// Wstawianie sekcji kolumn do tabeli
    	        $table.html('<thead '+main+'><tr '+mainRow+'>'+th+'</tr></thead>');
        	}
        	            
			// Jesli opcja multiselect wlaczona - osadzenie glownego checkboxa
			(settings.multiselect) ? $table.find('thead tr th:first').before('<th data-noresize width="1%" >'+settings.multiSelectCheckbox+'</th>') : '';
			
			// Jesli opcja subDataTable wlaczona - osadzenie pustej komorko
			(settings.subDataTable) ? $table.find('thead tr th:first').before('<th data-noresize width="1%" ></th>') : '';
						
		};
		
		this.headerColumnOptionsForm = function(name, sortable) 
		{
			// Jesli sortable dla danej kolumny == true
			if (sortable == true) {
				
				var sortOptions = '<li><a id="asc" name-column="'+name+'" href="">'+settings.sortNameUp+'&nbsp;<span class="glyphicon glyphicon-chevron-up"></span></a></li><li><a id="desc" name-column="'+name+'" href="">'+settings.sortNameDown+'&nbsp;<span class="glyphicon glyphicon-chevron-down"></span></a></li>';

				return '<div class="btn-group" id="btnColOptions" ><a class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a><ul class="dropdown-menu">'+sortOptions+'</ul></div>';
			}
			else {
				return '';
			}			
		};
		
		// Obsluga mechanizmu sortowania po kolumnach
		this.headerColumnOptions = function() 
		{			
			$table.find('thead tr th #colOptions #btnColOptions a').hide();			
			$table.find('thead tr th:last-child #colOptions #btnColOptions .btn').next('ul').addClass('pull-right');			
			$table.find('thead tr th:last-child').prev('th').find('#colOptions #btnColOptions .btn').next('ul').addClass('pull-right');
			
			$table.find('thead tr th').mouseover(function(index) {					
				$(this).find('#colOptions #btnColOptions a').show();		
						
			}).mouseout(function() {
				
				var is_display = $(this).find('#colOptions #btnColOptions .dropdown-menu').css('display');
				
				if (is_display === 'none') {
					$(this).find('#colOptions #btnColOptions a').hide();
				}				
			});
			
			// Jesli klikniecie w inny obszar strony to zamkniecie drop down menu
			$('body').click(function() {
				var is_display = $table.find('thead tr th #colOptions #btnColOptions .dropdown-menu').css('display');
				
				if (is_display === 'none') {
					$table.find('thead tr th #colOptions #btnColOptions a').hide();
				}
			});

			// Obsluga sortowania ASC
			$table.find('thead tr th #colOptions #btnColOptions #asc').click(function() {
				
				// Nazwa kolumny
				var nameColumn = $(this).attr('name-column');
				
				// Zmiana kierunku
				settings.sord = 'ASC';
				
				// Nazwa ostatnio sortowanej kolumny
				settings.lastColumnSord = nameColumn;
				
				// Odswiezenie grida z parametrami
				thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, settings.filtersToolbar);

				return false;
			});	

			// Obsluga sortowania DESC
			$table.find('thead tr th #colOptions #btnColOptions #desc').click(function() {
				
				// Nazwa kolumny
				var nameColumn = $(this).attr('name-column');
				
				// Zmiana kierunku
				settings.sord = 'DESC';
				
				// Nazwa ostatnio sortowanej kolumny
				settings.lastColumnSord = nameColumn;

				// Odswiezenie grida z parametrami
				thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, settings.filtersToolbar);

				return false;
			});
			
			// Obsliga sortowania poklikniecu w nazwe kolumny
			$table.find('thead tr th span #sortColumn').click(function() {
								
				// Nazwa kolumny z parametru
				var nameColumn = $(this).attr('name-column');				
				
				// Jesli sortuje dalej te sama kolumne
				if (settings.lastColumnSord !== nameColumn) {
					
					// Zmiana kierunku
					settings.sord = 'ASC';
	
					// Odswiezenie grida z parametrami
					thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, settings.filtersToolbar);	
				}
				else {
					// Zmiana kierunku
					if (settings.lastSord == 0) {
						
						// Zmiana kierunku
						settings.sord = 'DESC';	
						
						// Znacznik ostatniego kierunku sortowania
						settings.lastSord = 1;
						
					}
					else if (settings.lastSord == 1) {
						
						// Zmiana kierunku
						settings.sord = 'ASC';	
						
						// Znacznik ostatniego kierunku sortowania
						settings.lastSord = 0;						
					}
	
					// Odswiezenie grida z parametrami
					thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, settings.filtersToolbar);
				}
				
				// Nazwa kolumny ostatniego sortowania
				settings.lastColumnSord = nameColumn;
				
				return false;
			});					
		};
		
		// Toolbar
		this.toolbar = function(filtersToolbar) 
		{
			//var currentFilters = filtersToolbar; // Istniejace filtry
			var currentFilters = settings.filters; // Istniejace filtry
			
			var models = settings.colModel; // Modele kolumn    	
           	var modelsCount = models.length; // Ilosc
			var toolbar = '';
			var toolbarField = '';			
			var colIndex = 0;
			var mainRow = '';
			
			(settings.name === settings.nameMain) ? mainRow = 'class="mainRow headerToolbar"' : '';	
			
			toolbar = '<tr '+mainRow+'>';
			
			// Jesli wlaczony multiselect
			(settings.multiselect) ? toolbar += '<td></td>' : '';
			
			// Jesli opcja subDataTable wlaczona - osadzenie pustej komorki
			(settings.subDataTable) ? toolbar += '<td></td>' : '';


			// Dopisywanie kolumn do zmiennej
          	for (var i = 0; i < modelsCount; i++) {              
              	             	
			   
			   /**
            	 * Specjalna petla do naprawy Buga w IE8 
            	 * IE 8 nie potrafi odczytac array object podajac klucz
            	 * Trzeba sprawdzac dodatkowo poprzez petle czy istnieje 
            	*/			   
				for (key in models[i]) {
				
	              	// Jesli wyszukiwanie wlaczone
	              	if (models[i]['search'] == true ) {
	              	
	              		// Dla typu tekstowego
	              		if (models[i]['stype'] === 'text') {
	              			
	              			// Jesli istnieja filtry w toolbarze dla pola
	              			if (currentFilters[models[i]['name']] !== undefined) {
	              				
	              				// Operand
	              				var op;
	              				
	              				// Pobieranie operatora dla filtra
	              				for (var j in currentFilters[models[i]['name']]) {
	              					op = j;
	              				}
	              				
	              				// Pobieranie wartosci filtru dla kolumny
	              				var value = currentFilters[models[i]['name']][op];
	              				
	              				// Jesli kolumna niewidoczna to trzeba ja ukryc
	              				if (models[i]['visible']) {              				
		              				// Ustaw pole
		              				toolbarField = '<td column-name="'+models[i]['name']+'" style="text-align: center;"><input class="toolbarInput form-control" type="text" name="'+models[i]['name']+'" value="'+value+'" autocomplete="off" /></td>';
		              			}
		              			else {
		              				// Ustaw pole
		              				toolbarField = '<td column-name="'+models[i]['name']+'" style="text-align: center; display:none;"><input class="toolbarInput form-control" type="text" name="'+models[i]['name']+'" value="'+value+'" autocomplete="off" /></td>';
		              			}	
	              			}
	              			else {
	              				// Jesli kolumna niewidoczna to trzeba ja ukryc
	              				if (models[i]['visible']) {
	              					// Ustaw pole
	              					toolbarField = '<td column-name="'+models[i]['name']+'" style="text-align: center;"><input class="toolbarInput form-control" type="text" name="'+models[i]['name']+'" autocomplete="off" /> </td>';
	              				}
	              				else {
	              					// Ustaw pole
	              					toolbarField = '<td column-name="'+models[i]['name']+'" style="text-align: center; display:none;"><input class="toolbarInput form-control" type="text" name="'+models[i]['name']+'" autocomplete="off" /> </td>';
	              				}	
	              			}              			
	              			
	              		}
	              		
	              		// Dla listy select
	              		else if (models[i]['stype'] === 'select') {
	              			
	              			var select;
	              			var options = '<option value="">'+settings.defaultOptionFilterSelect+'</option>'; // domyslan opcja w liscie select              			
	              			//var isSelect = settings.filtersToolbar[models[i]['name']];
	              			var isSelect = settings.filters[models[i]['name']];
	              			
	              			
	              			var selected = '';
	              			var value = '';
	              			var op = '';
	              			
	              			// Pobieranie listy select
	              			for (var j in models[i]['searchoptions']) {
	              				
	              				// jesli istnieje filtr
	              				if (isSelect != undefined) {
	              					
	              					// Jesli podano operator zdefiniowany
	              					if (models[i]['op'] != undefined) {
	              						
	              						// Jesli wybrany rowny temu z opcji to ma byc zaznczony
	              						(isSelect[models[i]['op']] == models[i]['searchoptions'][j]) ? selected = 'selected="selected"' : selected = '';              						              					
	              					}
	              					// Jesli nie zdefiniowano operatora to domyslny
	              					else {
	              						// Jesli wybrany rowny temu z opcji to ma byc zaznczony
	              						(isSelect[settings.defaultFilterName] == models[i]['searchoptions'][j]) ? selected = 'selected="selected"' : selected = '';              						
	              					}
	              					
	              					options += '<option value="'+models[i]['searchoptions'][j]+'" '+selected+' >'+j+'</option>';
	              				}
	              				else {              					
	              					options += '<option value="'+models[i]['searchoptions'][j]+'">'+j+'</option>';
	              				}	        				
	              			}
	              			
	              			// Jesli istnieja filtry w toolbarze dla pola
	              			if (currentFilters[models[i]['name']] !== undefined) {
	              				
	              				// Operand
	              				var op;
	              				
	              				// Pobieranie operatora dla filtra
	              				for (var j in currentFilters[models[i]['name']]) {
	              					op = j;
	              				}
	              				
	              				// Pobieranie wartosci filtru dla kolumny
	              				value = currentFilters[models[i]['name']][op];
	              			
	              				// Jesli kolumna niewidoczna to trzeba ja ukryc
	              				if (models[i]['visible']) {
	              					// Lista select
	              					select = '<td column-name="'+models[i]['name']+'"><select class="toolbarSelect" name="'+models[i]['name']+'">'+options+'</select></td>';
	              				}
	              				else {
	              					// Lista select
	              					select = '<td column-name="'+models[i]['name']+'" style="display: none;" ><select class="toolbarSelect" name="'+models[i]['name']+'">'+options+'</select></td>';
	              				}
	              			
	              				// Dodanie pola toolbar
	              				toolbarField = select;              				
	              			}
	              			else {
	              				// Jesli kolumna niewidoczna to trzeba ja ukryc
	              				if (models[i]['visible']) {
	              					// Lista select              			
	              					select = '<td column-name="'+models[i]['name']+'"><select class="toolbarSelect" name="'+models[i]['name']+'">'+options+'</select></td>';
	              				}
	              				else {
	              					// Lista select              			
	              					select = '<td column-name="'+models[i]['name']+'" style="display: none;" ><select class="toolbarSelect" name="'+models[i]['name']+'">'+options+'</select></td>';
	              				}	
	              				
	              				// Dodanie pola toolbar
	              				toolbarField = select;
	              			}	
	              		}
	              		
	              	}
	              	else {
	              		toolbarField = '<td></td>';
	              	}
              	
              	
			} /*KONIEC PETLI DLA IE8*/
              	
				// Osadzenie pola filtra w toolbarze
            	toolbar += toolbarField;
			}
						
			toolbar += '</tr>';
			
			// Umieszczanie html toolbara
			$table.find('thead tr:last').after(toolbar);		
						
			// Obsluga filtrowania
			thisObject.toolbarFilter();	
		};
		
		// Obsluga filtrowania
		this.toolbarFilter = function() 
		{			
			var nameColumn;
			var value;
			var op = settings.defaultFilterName;
			
			// Filtry					  											
			//var filtersToolbar = settings.filtersToolbar;
			var filtersToolbar = settings.filters;
			
		
			// Zdarzenie dla pola tekstowego
			$table.find('.toolbarInput').keypress(function(e) {			
					
				// Jesli wcisnieto Enter
				if (e.keyCode == '13') {
			    				    	
			     	nameColumn = $(this).attr('name'); // nazwa kolumny
				  	value = $(this).val(); // wartosc
				  	
				  	// Jesli nie pusta wartosc filtra
				  	if (value !== '') {
				  		
				  		// SPrawdzanie czy podano inny operator niz domyslny
					  	for (var i in settings.colModel) {
					  		if (settings.colModel[i]['name'] === nameColumn) {
					  			
					  			// Jesli znaleziono zdefiniowany operator to nadpisz domyslny
					  			(settings.colModel[i]['op'] != undefined) ? op = settings.colModel[i]['op'] : '';					  			
					  		}					  							  		
					  	}
					  	
					  	filtersToolbar[nameColumn] = {}; // Nazwa kolumny 
					  	filtersToolbar[nameColumn][op] = value; // Przypisanie wartosci do nazwy kolumny
					  	
					  	// Zapamietanie filtrow	
						//settings.filtersToolbar = filtersToolbar;
						
												
						/**
						 * @Todo sprawdzanie filtro zaawansowanych i z toolbara  
						 */
						
						// Zapis do filtrow globalnych
						settings.filters = filtersToolbar;
		
					  	// Odswiezenie grida z parametrami
						thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, filtersToolbar);					
					}
				  	// Jesli pusta wartosc filtra
				  	else {
				  		// Jesli filtr juz istnieje i zmieniono jego wartosc na pusta
				  		if (filtersToolbar[nameColumn] != undefined) {
				  			
				  			// Usuwanie elementu
				  			delete filtersToolbar[nameColumn];
				  		}
				  		
				  		// Odswiezenie grida z parametrami
						thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, filtersToolbar);
				  	}
				  	
				  	// Box filters
				  	thisObject.pillBoxFilters();
			   	}							  	
			});
			
			// Zdarzenie dla listy select
			$table.find('.toolbarSelect').change(function(e) {
							     		
				nameColumn = $(this).attr('name'); // nazwa kolumny
				value = $(this).val(); // wartosc
				  		
				// Jesli nie pusta wartosc filtra
				if (value !== '') {
					
					// SPrawdzanie czy podano inny operator niz domyslny
					for (var i in settings.colModel) {
						if (settings.colModel[i]['name'] === nameColumn) {
					  			
					  		// Jesli znaleziono zdefiniowany operator to nadpisz domyslny
					  		(settings.colModel[i]['op'] != undefined) ? op = settings.colModel[i]['op'] : '';					  			
					  	}					  							  		
					}				  	
							
					filtersToolbar[nameColumn] = {}; // Nazwa kolumny 
					filtersToolbar[nameColumn][op] = value; // Przypisanie wartosci do nazwy kolumny 
		
					// Zapamietanie filtrow 
					//settings.filtersToolbar = filtersToolbar;
					
					/**
					 * @Todo sprawdzanie filtro zaawansowanych i z toolbara  
					*/
						
					// Zapis do filtrow globalnych
					settings.filters = filtersToolbar;
		
					// Odswiezenie grida z parametrami
					thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, filtersToolbar);			
				
				}
				// Jesli pusta wartosc filtra
				else {
					// Jesli filtr juz istnieje i zmieniono jego wartosc na pusta
				  	if (filtersToolbar[nameColumn] != undefined) {
		
				  		// Usuwanie elementu
				  		delete filtersToolbar[nameColumn];
				  	}
				  	
				  	// Odswiezenie grida z parametrami
					thisObject._init(settings.page, settings.rows, nameColumn, settings.sord, filtersToolbar);	
				}
				
				// Box filters
				thisObject.pillBoxFilters();   								  	
			});
			
		};
		
		// 
		this.parameters = function() 
		{
			var countParameters = 0; // Poczatkowa ilosc wybranych parametrow
			
			var showHideForm = '<div id="showHideForm"><button class="btn btn-link btn-xs"><span class="glyphicon glyphicon-arrow-up"></span> - pokaż</button></div>';
			
			//showHideForm = '';
			
			var filterForm = ''; // Formularz filtru zaawansowanego
			(settings.parameters['nameFilterForm'] != false) ? filterForm = '<div id="parametersFilterForm" class="col-md-12" >'+showHideForm+'<div class="filterFormContent"></div></div>' : '';
			
			var infoOfChooseParameters = '<div id="infoOfChooseParameters" class="col-md-12" >Wybranych parametrów: <span class="countParameters badge badge-info">'+countParameters+'</span> &nbsp;&nbsp; Ilość wyników spełniających kryteria: <span class="totalResult badge badge-info">'+countParameters+'</span></div>';
			
			var filterPillbox = '<div class="filterPillbox"></div>';
			
			var showHideColumns = (settings.showHideColumns) ? this.showHideColumnsForm() : '';
						
			var header = '<div id="parametersHeader"><span id="parametersCaption" >'+settings.parameters['caption']+'</span><span id="showHideColumns" >'+showHideColumns+'</span></div>';			
			
			parametersContent = '<div id="parameters" class="row-fluid"><div class="col-md-12 well">'+header+' '+filterForm+' '+infoOfChooseParameters+' '+filterPillbox+'</div></div>';
			
			// Jesli istnieje to usun i wstaw
			($('#parameters').length == 0) ? $table.before(parametersContent) : '';
			
			// Osadzenie formularza podanego w parametrze
			(settings.parameters['nameFilterForm'] != false) ? $('#'+settings.parameters['nameFilterForm']).appendTo('.filterFormContent') : '';
			
			thisObject.showHideForm();
		};
		
		this.showHideForm = function()
		{
			$('#showHideForm').click(function() {
				$('.filterFormContent').hide();
			});
		};
		
		// Ilosc wybranych parametrow
		this.countParameters = function() 
		{
			var countParameters = 0; // Poczatkowa ilosc wybranych parametrow
			
			// Tylko jesli wysylany jest glowna lista
			if (settings.name === settings.nameMain) {
				
				// ZLiczanie ilosc parametrow
				for (var i in settings.filters) {
					countParameters++;				
				}	
				
				// countParameters
				$('#infoOfChooseParameters .countParameters').html(countParameters);
			}			
		};
		
		// Box filters
		this.pillBoxFilters = function()
		{			
			var pillBox = '';
			var label = '';
			var value = '';
			var op = settings.defaultFilterName;
			var k = 0; // Licznik
						
			// Tylko jesli wysylany jest glowna lista
			if (settings.name === settings.nameMain) {
				
				$('.filterPillbox').html('');
				
				// Filtry
				for (var i in settings.filters) {
					
					k = 0;
									
					// Przeszukiwanie colModel
					for (var j in settings.colModel) {
					
						// Jesli znaleziono to pobierz nazwe kolumny
						if (settings.colModel[j]['name'] === i) {
							
							// Label
							label = settings.colNames[k];
			
							// DLa filtrow typu text
							if (settings.colModel[j]['stype'] === 'text') {
								
								// Pobieranie operatora - jest nie podano recznie to pobiera domyslnego
								(settings.colModel[j]['op'] != undefined) ? op = settings.colModel[j]['op'] : op = settings.defaultFilterName;
								
								// Zapis wartosci wybranej przez uzytkownika
								value = settings.filters[i][op];						
							}
							// Dla filtrow z lista select
							else if (settings.colModel[j]['stype'] === 'select') {
								
								// Pobieranie operatora
								(settings.colModel[j]['op'] != undefined) ? op = settings.colModel[j]['op'] : '';
								
								// Opcje dla selecta
								for (var k in settings.colModel[j]['searchoptions']) {
									
									// Jesli wartosci z definicji i z filtra sa rowne
									if (settings.colModel[j]['searchoptions'][k] === settings.filters[i][op]) {
										
										// Nazwa opcji z selecta
										value = k;
									}								
								}							
							}	 
						}
						
						//Inkrementacja licznika
						k++;
					}
					
					// Html pill boxa				
					pillBox = '<button class="btn btn-default btn-xs" data-value="'+i+'">'+label+': <span class="valueFilter">('+value+')</span><span class="glyphicon glyphicon-remove"></span></button>';
					
					$('.filterPillbox').append(pillBox);
				}
			}
			
			
			/**
			 * Obsluga kasowanie filtrow 
			 */
			$('.filterPillbox button').click(function() {
				
				// Nazwa filtra
				var filter = $(this).attr('data-value');
				
				// Usuniecie filtra
				delete settings.filters[filter];
				
				// Usuniecie pillboxa
				$(this).remove();
								
				// Odswiezenie grida z parametrami
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filters);				
			});			
			
		};
		
		// Zwraca ID zaznaczonych wierszy przez multiselect
		this.getFilters = function()
		{			
			return settings.filters;
		};
		
		// Wstawia puste komorki do wierszy naglowkowych
		this.subDataTable = function()
		{	
			/**
			 * Rozwiniecie sub tabeli 
			 */
			$table.find('tbody a#expandSubDataTable').click(function() {
				
				// Id rekordu
				var dataId = $(this).attr('data-id');
				
				// Ikony
				$(this).hide();				
				$(this).next().show();
												
				// Poszukiwanie innych sub gridow w celu usuniecia 				
				$table.find('tbody tr').each(function(index) {
					
					var otherSubGrid = $(this).next('tr.expandSubRow').length;
					
					// Jesli znalecziono inny subgrid to usuniecie z drzewa DOM
					if (otherSubGrid > 0) {						
						$(this).find('#expandSubDataTable').show(); // Zmiana ikony
						$(this).find('#collapseSubDataTable').hide(); // Zmiana ikony						
						$(this).next('tr').remove(); // Usuniecie wiersza z sub tabela
					}					
				});

				// Colpan
				var colSpan = 1;
				
				(settings.multiselect) ? colSpan++ : '';

				// Wiersz z subgridem
				var row = '<tr class="expandSubRow"><td colspan="'+colSpan+'" class="expandSubIcon"><i class="icon-arrow-right" style=""></i></td><td colspan="'+settings.colModel.length+'" class="subCell" style="padding: 0px; border: 0px;"></td></tr>';
				
				// Umieszczenie HTML subgrida w drzewie DOM
				$(this).parents('tr').after(row);
		
				// Obsługa sub tabeli
				settings.onSubDataTableExpand(dataId);
							
				/**
				 * Korekcja .table-hover i table-striped dla zagniezdzonej listy 
				*/
				$(this).parents('tr').next().mouseover(function() {
					$(this).find('table thead tr:nth-child(2) > td').css('background', '#f9f9f9');
					$(this).find('table tr:nth-child(odd) > td').css('background', '#f9f9f9');
				});

				return false;
			});
			
			// Automatyczne uruchomienie sub tabeli
			$table.find('tbody a#collapseSubDataTable').click(function() {
			
				// Id rekordu
				var dataId = $(this).attr('data-id');
				
				$(this).hide();								
				$(this).prev().show();
				
				// Czy pod wybranym wierszem jest juz otwarty subgrid
				var isCurrentOpen = $(this).parents('tr').next('tr').find('#subDataTable_'+dataId).length;
				
				// Usuwanie wiersza przy zamykaniu
				$(this).parents('tr').next('tr').remove();
				
				return false;
			});	
			
		};
		
		// Obsluga ikon kierunku sortowania
		this.setIconSort = function() 
		{
			// Nazwa kolumny
			var nameColumn;
			var column;
			
			// Pobranie nazwy aktualnej kolumny
			(settings.lastColumnSord === '') ? column = settings.sidx : column = settings.lastColumnSord;
			  	
        	var models = settings.colModel; // Modele kolumn
            var colModels = models.length; // Ilosc kolumn
           	
           	// Pobranie nazwy aktualnej kolumny z parametru
           	var nameColumn = $table.find('thead tr th span a[name-column="'+column+'"]').attr('name-column');
           	
            // Usuwanie wszystkich ikon kierunku
            for (var i = 0; i < colModels; i++) {
            	
               /**
            	 * Specjalna petla do naprawy Buga w IE8 
            	 * IE 8 nie potrafi odczytac array object podajac klucz
            	 * Trzeba sprawdzac dodatkowo poprzez petle czy istnieje 
            	*/		
            	for (key in colModels[i]) {				
            		// Usuwanie
            		$table.find('thead tr th span a[name-column="'+models[i]['index']+'"]').next('i').remove();
            	}
            	
            }
			
			if (settings.sord === 'ASC') {
				$table.find('thead tr th .nameColumn a[name-column="'+nameColumn+'"]').after('<span class="glyphicon glyphicon-chevron-up"></span>');
			}
			else if (settings.sord === 'DESC') {
				$table.find('thead tr th .nameColumn a[name-column="'+nameColumn+'"]').after('<span class="glyphicon glyphicon-chevron-down"></span>');
			}
			
		};
		
		this.loadDataFromAjax = function(setPage, row_per_page, setSidx, setSord, setFilters)
		{
			// Domyslne pobieranie z glownego parametru
			(row_per_page != undefined) ? rows = row_per_page : rows = settings.rows;
			
			(setPage != undefined) ? page = setPage : page = settings.page;

			(setSidx != undefined) ? sidx = setSidx : sidx = settings.sidx;

			(setSord != undefined) ? sord = setSord : sord = settings.sord;
			
			(setFilters != undefined) ? filters = setFilters : filters = settings.filters;
						
			return $.ajax({ 
						type: 'POST', 
						url: options.url, 
						dataType: 'json', 
						data: {grid_name: settings.name, rows: rows, page: settings.page, sidx: sidx, sord: sord, filters: filters, type: 'grid'},
						beforeSend: function ( xhr ) {
							thisObject.beforeSend(xhr);
						}
					});
		};
		
		/**
		 * Funkcjonalnosc odswiezania listy 
		 */
	    this.refresh = function(setPage, row_per_page, setSidx, setSord, setFilters)
	    {
	    	// Domyslne pobieranie z glownego parametru
			(row_per_page != undefined) ? settings.rows = row_per_page : '';
			
			(setPage != undefined) ? settings.page = setPage : '';

			(setSidx != undefined) ? settings.sidx = setSidx : '';

			(setSord != undefined) ? settings.sord = setSord : '';
			
			(setFilters != undefined) ? settings.filters = setFilters : '';
				  	
			// Odswiezenie
	    	thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filters);	
	    };
	    
	    /**
	     * Obsługa i osadzenie przycisku do odswiezania 
	     */
	    this.refreshButton = function()
	    {
	    	// Button html
	    	var refreshButton = '<a href="" id="refreshButton" class="btn btn-xs"><span class="glyphicon glyphicon-refresh"></span></a>';
	    	
	    	// Umieszczenie
	    	$table.next('#'+settings.footerName).find('#tablepagination').before('<div style="float: left; width: 20px; height: 20px; margin: 2px 0px 0px 5px;">'+refreshButton+'</div>');
	    		    	
	    	// Obsluga zdarzenia odswiezenia
	    	$table.next().find('#refreshButton').click(function (){
	    		
	    		// uruchomienie metody 
	    		thisObject.refresh();
	    		
	    		return false;
	    	});	    	
	    };
	    
	    this.beforeSend = function(xhr)
	    {
	    	// Pasek ladowania
	    	(settings.progressBar) ? thisObject.progressBar() : '';
	    };
	    
	    this.progressBar = function(xhr)
	    {
	    	// Colspan
	    	var colSpan = settings.totalColumns;
	    	
	    	// Jesli multiselect wlaczony 
			(settings.multiselect) ? colSpan++ : '';
			    
			// Jesli subgridy wlaczone
			(settings.subDataTable) ? colSpan++ : '';
	    	
	    	// Progress bar
	    	var progressBar = '<tr id="progressBar"><td colspan="'+colSpan+'"><div style="width: 200px; margin: 0px auto;" class="progress progress-striped active"><div class="progress-bar progress-bar-info" style="width: 100%;"></div></div></td></tr>';
	    		
	    	// Umieszczenie paska
	    	$table.find('thead').after(progressBar);
	    };
		
		// Tworzenie wierszy dla grida
		this.createCells = function(mydata)
		{
           	var data = mydata;
            	            	
           	var models = settings.colModel; // Modele kolumn    	
           	var modelsCount = models.length; // Ilosc
           	var dataCount = data.length;
           	var td = ''; // Rekord danych            	
           	var record = '';
           	
           	var main = ''; // Id dla tbody tylko jesli glowna lista
           	var mainRow = '';
           	var textALign = '';
                       	
           	// Tylko jesli wysylany jest glowna lista
			(settings.name === settings.nameMain) ? main = 'id="main"' : ''; 
           	(settings.name === settings.nameMain) ? mainRow = 'class="mainRow"' : ''; 
           	
           	var records = '<tbody '+main+'>';
           	
          	
           	// Dopisywanie kolumn do zmiennej
          	for (var i = 0; i < dataCount; i++) {
                	
               	record = '';
               	
               	var cellNumber = 0; // Poczatkowa warotsc indexu
               	
               	// Jesli wlaczony subgrid to dodaj przycisk expand
               	(settings.subDataTable == true ) ? td += '<td><a id="expandSubDataTable" data-id="'+data[i]['id']+'" href="">'+settings.expandSubDataTable+'</a><a id="collapseSubDataTable" style="display: none;" data-id="'+data[i]['id']+'" href="">'+settings.collapseSubDataTable+'</a></td>' : '';
               	
               	// Jesli wlaczony multiselect to dodaj komorke z checkboxem
               	(settings.multiselect == true ) ? td += '<td>'+settings.multiSelectCheckbox+'</td>' : '';
               	
               	// Rysowanie wierszy
               	for (var j in data[i]) {
               	
               		/** 
               		 * Sprawdzanie czy istnieje indeks
               		 * W przypadku gdy sa subgridy moga byc rozne dlugosci
               		 */ 
               		if (models[cellNumber] !== undefined) {
               		
               			// Wyswietlanie tekstu
               			(models[cellNumber]['align'] !== undefined) ? textALign = 'text-align: '+models[cellNumber]['align']+';' : 'text-align: left;';
               			                		
	               		// Jesli visible kolumny = true to wyswietlaj
	               		if (models[cellNumber]['visible'] == true) {         			
		            		td += '<td column-name="'+models[cellNumber]['name']+'" style="'+textALign+'" >'+data[i][j]+'</td>';
		            	}
		            	// Jesli visible kolumny = true to niewyswietlaj
		            	else {
		            		td += '<td column-name="'+models[cellNumber]['name']+'" style="display: none; '+textALign+'">'+data[i][j]+'</td>';
		            	}              		
	            	
	            		cellNumber++;
	            	}
               	}
                	
                	
                	
               	record += '<tr id="'+data[i]['id']+'" '+mainRow+' '+(settings.onClickRow != false ? 'onclick="'+settings.onClickRow+'(this);" style="cursor: pointer;"' : '')+' >'+td+'</tr>';
               	                	
               	td = '';

               	records += record;                	
			}
			
			records += '</tbody>';
                
            // Wstawianie wierszy danych
            $table.find('thead').after(records);
		};
		
		// Wybór paginacji
		this.pagination = function(data)
		{
			switch (settings.pagination) {
				case 'advanced' :
					return thisObject.paginationAdvanced(data);
					break;
				
				case 'basic' :
					return thisObject.paginationBasic(data);
					break;	
					
				default :
					return thisObject.paginationAdvanced(data);
					break;
			}			
		};
		
		this.paginationAdvanced = function(data)
		{			
			var total = data.total;
			var limit = data.limit;
			var currentPage = data.current_page;
			
			// Total result
			thisObject.totalResult(total);
			
			var prevEnabled = '<button class="btn btn-xs"  id="prev" ><span class="glyphicon glyphicon-backward"></span></button>';
			var prevDisabled = '<button class="btn btn-xs disabled" ><span class="glyphicon glyphicon-backward"></span></button>';
			
			var firstEnabled = '<button class="btn btn-xs"  id="first" ><span class="glyphicon glyphicon-fast-backward"></span></button>';
			var firstDisabled = '<button class="btn btn-xs disabled" ><span class="glyphicon glyphicon-fast-backward"></span></button>';
			
			var nextEnabled = '<button class="btn btn-xs"  id="next" ><span class="glyphicon glyphicon-forward"></span></button>';
			var nextDisabled = '<button class="btn btn-xs disabled" ><span class="glyphicon glyphicon-forward"></span></button>';
			
			var lastEnabled = '<button class="btn btn-xs"  id="last" ><span class="glyphicon glyphicon-fast-forward"></span></button>';
			var lastDisabled = '<button class="btn btn-xs disabled" ><span class="glyphicon glyphicon-fast-forward"></span></button>';
			
			totalPage = Math.ceil(total / limit);

			var pagination = '';			
			var optionsRowPerPage; // Opcje dla ilosci wierszy na strone
						
			for (var i in settings.rowList) {				
				//rowNum
				optionsRowPerPage += '<option value="'+settings.rowList[i]+'" >'+settings.rowList[i]+'</option>';				
			}
			
			// Lista select ilosc wierzy na strone
			var row_per_page = '<select id="row_per_page" >'+optionsRowPerPage+'</select>';
			
			
			var labelPage = '<div id="labelPage"><span>Strona: </span></div>';
			var inputPage = '<div id="inputPage"><input class="form-control" id="nr_page" type="text" value="'+currentPage+'" placeholder="Enter your nubmer page"></div>';
			var fromPage = '<div id="fromPage"> z '+totalPage+'</div>';
			
			var pageInput = '<div id="pageInput">'+labelPage+inputPage+fromPage+'</div>';
			
			
			// Buttony paginacji
			if (total == 0)
			{
				pagination = '<div id="tablepagination"><table class="table datatable table-condensed" ><tr><td>'+firstDisabled+' '+prevDisabled+'</td><td> '+pageInput+'</td><td>'+nextDisabled+' '+lastDisabled+'</td> <td>'+row_per_page+'</td> </tr></table></div>';
			}
			else if (currentPage == 1 && currentPage != totalPage)
			{
				pagination = '<div id="tablepagination"><table class="table datatable table-condensed"><tr><td>'+firstDisabled+' '+prevDisabled+'</td><td> '+pageInput+'</td><td>'+nextEnabled+' '+lastEnabled+'</td> <td>'+row_per_page+'</td> </tr></table></div>';
			}
			else if (currentPage != 1 && currentPage != totalPage)
			{
				pagination = '<div id="tablepagination"><table class="table datatable table-condensed" ><tr><td>'+firstEnabled+' '+prevEnabled+'</td><td> '+pageInput+'</td><td>'+nextEnabled+' '+lastEnabled+'</td> <td>'+row_per_page+'</td> </tr></table></div>';
			}
			else if (currentPage != 1 && currentPage == totalPage)
			{
				pagination = '<div id="tablepagination"><table class="table datatable table-condensed" ><tr><td>'+firstEnabled+' '+prevEnabled+'</td><td> '+pageInput+'</td><td>'+nextDisabled+' '+lastDisabled+'</td> <td>'+row_per_page+'</td> </tr></table></div>';
			}			
			else if (currentPage == 1 && currentPage == totalPage)
			{
				pagination = '<div id="tablepagination"><table class="table datatable table-condensed" ><tr><td>'+firstDisabled+' '+prevDisabled+'</td><td> '+pageInput+'</td><td>'+nextDisabled+' '+lastDisabled+'</td> <td>'+row_per_page+'</td> </tr></table></div>';
			}
					
			
			/**
			 * @Todo
			 */			
			var first = ((currentPage * limit) - limit) + 1;
			var last = currentPage * limit;
			var from = total;
			
			// Wyliczanie ilosc rekordow na ostatniej stronie
			if ((last - total) > 0)
			{
				last = total;
			}
			
			
			// Informacje na temat ilosc itp
			var viewInfo = 'Widocznych '+first+'-'+last+' z '+from;
			
			$table.next('#'+settings.footerName).html(pagination);			
			$table.next('#'+settings.footerName).append('<div id="viewInfo" >'+viewInfo+'</div>');
			
			// Dodanie styli 
			$table.next('#'+settings.footerName).css('border', '1px solid #DDDDDD');
			$table.next('#'+settings.footerName).css('border-top', 'none');
			$table.next('#'+settings.footerName).css('background-color', '#F5F5F5');
			
			// Next
			$table.next('#'+settings.footerName).find('#next').click(function() {
				
				// Zwiekszenie o 1
				settings.page = currentPage + 1;
				
				// Wywołanie z kolejną stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
			// Last
			$table.next('#'+settings.footerName).find('#last').click(function() {
				
				// Inkrementacja
				settings.page = totalPage;
				
				// Wywołanie z kolejną stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
			// Numer strony podany w input			
			$table.next('#'+settings.footerName).find('#nr_page').keypress(function(e) {
				
				// Jesli wcisnieta Enter
				if (e.keyCode == '13') {
			    	
			     	// Przypisanie strony
			     	settings.page = $(this).val();
						
					// Wywołanie z wpisaną stroną
					thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
			   	}
			});

			// Previous
			$table.next('#'+settings.footerName).find('#prev').click(function() {
				
				// Dekrementacja
				settings.page = currentPage - 1;
				
				// Wywołanie z poprzednią stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
			// First
			$table.next('#'+settings.footerName).find('#first').click(function() {
				
				// Inkrementacja
				settings.page = 1;
				
				// Wywołanie z kolejną stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
			// Row per page - ilosc wynikow na strone wybierane z listy select
			$table.next('#'+settings.footerName).find('#row_per_page').change(function() {
								
				settings.rows = $(this).val();
				
				thisObject._init(settings.page, $(this).val(), settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
		};
		
		this.paginationBasic = function(data)
		{			
			var total = data.total;
			var limit = data.limit;
			var currentPage = data.current_page;
			
			// Total result
			thisObject.totalResult(total);
			
			var prevEnabled = '<li><a href="#" id="prev" >Poprzedni</a></li>';
			var prevDisabled = '<li class="disabled"><a href="#" >Poprzedni</a></li>';
			
			
			var nextEnabled = '<li><a href="#" id="next">Następny</a></li>';
			var nextDisabled = '<li class="disabled"><a href="#">Następny</a></li>';
			
			//total = 9;
			
			totalPage = Math.ceil(total / limit);

			var pagination = '';		
			var buttons = '';	
			var pages = '';
			
			var leftNumberPages = ''; // Numery stron lewe
			var rightNumberPages = ''; // Numery stron prawe - ostatania
			var firstLimitNumberPage = settings.optionBasicPagination['countLeftNumbers']; // Limit pierwszych numerow stron LEWE
			var secondLimitNumberPage = settings.optionBasicPagination['countLeftNumbersOnLastPage']; // Limit pierwszych numerow stron LEWE bedac na ostatniej stronie 
			var innerLimitNumberPage = settings.optionBasicPagination['countInnerNumbers']; // Limit dla srodkowych numerow stron 
			var paginationsDotts = '<li class="disabled" ><a href="#" >...</a></li>';
			var displayLastPage = true;
			
						
			// Buttony paginacji
			if (currentPage == 1 && currentPage != totalPage)
			{	
				if (totalPage <= firstLimitNumberPage) {
					firstLimitNumberPage = totalPage;
					displayLastPage = false;
				}
				
				for (var i = 1; i < (firstLimitNumberPage + 1); i++) {
					active = (currentPage == i) ? 'class="disabled"' : '';
					leftNumberPages += '<li '+active+'><a href="#" >'+i+'</a></li>';
				}
				
				// Prawy
				rightNumberPages = '<li ><a href="#" >'+totalPage+'</a></li>';
				
				// Btns
				if (displayLastPage) {
					pages = leftNumberPages+' '+paginationsDotts+' '+rightNumberPages; 
				}
				else {
					pages = leftNumberPages;
				}
				
				buttons = '<ul>'+prevDisabled+''+pages+''+nextEnabled+'</ul>';
			}
			else if (currentPage != 1 && currentPage != totalPage)
			{
				// Sprawdzanie czy ilosc stron nie przekracza ilosci zadeklarowanej
				if (totalPage <= firstLimitNumberPage) {
					firstLimitNumberPage = totalPage;
					displayLastPage = false;
				}
				
				if (currentPage >= firstLimitNumberPage) {
					
					leftNumberPages += '<li ><a href="#" >'+1+'</a></li>'+paginationsDotts;
					
					for (var i = (currentPage - 1); i < (currentPage + (innerLimitNumberPage - 1)); i++) {
						
						// Tylko jesli nie jest to ostatnia strona
						if (i < totalPage) {
							active = (currentPage == i) ? 'class="disabled"' : '';
							leftNumberPages += '<li '+active+'><a href="#" >'+i+'</a></li>';
						}												
					}
					
				}
				else {
				
					for (var i = 1; i < (firstLimitNumberPage + 1); i++) {
						active = (currentPage == i) ? 'class="disabled"' : '';
						leftNumberPages += '<li '+active+'><a href="#" >'+i+'</a></li>';
					}					
				}
				
				// Prawy
				rightNumberPages = '<li ><a href="#" >'+totalPage+'</a></li>';
				
				if (displayLastPage) {
					// Btns
					pages = leftNumberPages+' '+paginationsDotts+' '+rightNumberPages;
				}
				else {
					// Btns
					pages = leftNumberPages;
				} 
				
				buttons = '<ul>'+prevEnabled+''+pages+''+nextEnabled+' </ul>';
			}
			
			// Ostatnia strona
			else if (currentPage != 1 && currentPage == totalPage)
			{
				// Sprawdzanie czy ilosc stron nie przekracza ilosci zadeklarowanej
				if (totalPage <= firstLimitNumberPage) {
					secondLimitNumberPage = totalPage;
					displayLastPage = false;
				}
				
				for (var i = 1; i < (secondLimitNumberPage + 1); i++) {
					active = (currentPage == i) ? 'class="disabled"' : '';
					leftNumberPages += '<li '+active+'><a href="#" >'+i+'</a></li>';
				}
				
				// Kropki
				leftNumberPages;
				
				// Prawy
				rightNumberPages = '<li class="disabled"><a href="#" >'+totalPage+'</a></li>';
				
				if (displayLastPage) {
					// Btns
					pages = leftNumberPages+' '+paginationsDotts+' '+rightNumberPages;
				}
				else {
					// Btns
					pages = leftNumberPages;
				} 
				
				buttons = '<ul>'+prevEnabled+''+pages+''+nextDisabled+' </ul>';
			}			
			
			// Jesli tylko jedna strona
			else if (currentPage == 1 && currentPage == totalPage)
			{
				for (var i = 1; i < totalPage + 1; i++) {
					pages += '<li class="disabled"><a href="#">'+i+'</a></li>';
				}
				
				buttons = '<ul>'+prevDisabled+''+pages+''+nextDisabled+' </ul>';
			}
					
			// Html paginacji
			pagination = '<div class="pagination pagination-'+settings.optionBasicPagination['sizes']+' pagination-'+settings.optionBasicPagination['alignment']+'">'+buttons+'</div>';
			
			// Osadzenie kodu html
			$table.next('#'+settings.footerName).html(pagination);			
						
						
			// Next
			$table.next('#'+settings.footerName).find('#next').click(function() {
				
				// Zwiekszenie o 1
				settings.page = currentPage + 1;
				
				// Wywołanie z kolejną stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});
			
			// Per number
			$table.next('#'+settings.footerName).find('a').click(function() {
				
				var isDisable = $(this).parent('li').hasClass('disabled');
				var isActive = $(this).parent('li').hasClass('active');
				var isNext = $(this).is('#next');
				var isPrev = $(this).is('#prev');
				
				if ( ! isDisable && ! isActive && ! isNext && ! isPrev ) {
					var number = parseInt($(this).text());
					
					// Ustawienie strony
					settings.page = number;
					
					// Wywołanie z poprzednią stroną
					thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				}
				
				return false;
			});

			// Previous
			$table.next('#'+settings.footerName).find('#prev').click(function() {
				
				// Dekrementacja
				settings.page = currentPage - 1;
				
				// Wywołanie z poprzednią stroną
				thisObject._init(settings.page, settings.rows, settings.sidx, settings.sord, settings.filtersToolbar);
				
				return false;
			});

			
		};
		
		// totalResult
		this.totalResult = function(totalResult) {
			
			// Tylko jesli wysylany jest glowna lista
			if (settings.name === settings.nameMain) {
				$('#infoOfChooseParameters .totalResult').html(totalResult);
			}
			
		};

	};
	
	// Nazwa glownej listy
	var nameDataTable = '';
	
	$.fn.dataTable = function(options) {
 
    	options = $.extend({
    		nameMain		: '',
    		name			: '',
        	url				: '',
        	caption			: false,
        	footerName		: 'datatablefooter',
        	data			: [],
            rowNum			: 10,
            rowList			: [5, 10, 20, 30],
            colNames      	: [],
            colModel      	: [],        
            colResize		: true,
            multiselect		: false,
            progressBar		: true,
            showHideColumns : true,
            sidx			: 'id',
            sord 			: 'ASC',
            sortNameUp		: 'Rosnąco',
            sortNameDown	: 'Malejąco',            
            filterToolbar	: false,
            filters			: {},
            //parameters		: {caption: 'Parametry listy', container: false},
            subDataTable	: false,
            style			: 'extended',
            optionDisplay	: {condensed: true, bordered: true, striped: true, hover: true},
            pagination		: 'extended',
            optionBasicPagination: {alignment: 'center', sizes: 'default', countLeftNumbers: 6, countInnerNumbers: 3, countLeftNumbersOnLastPage: 5},
            onSubDataTableExpand        : function() {},
            //groupHeaders	: [{startColumnName: 'sys_last_name', numberOfColumns: 3, titleText: '<strong>Testowa grupa</strong>'}, ],
            groupHeaders	: [],
            panel			: true,
            onClickRow		: false,
            footer			: [],
            afterLoadCallback: function() {}
        }, options);

    
        return this.each(function()
        {
        	// Thus
        	var $this = $(this);
        	
        	// Add class datatable
        	$this.addClass('datatable');
        	
        	$this.next('#'+options.footerName).addClass('datatablefooter');
        	
        	// Zapis nazwy glowenj listy
        	options.name = $this.attr('id');
        	
        	// Nazwa glownej listy
        	(nameDataTable === '') ? nameDataTable = $this.attr('id') : '';
        	
        	// Zapis nazwy glownej listy do ustawien
        	options.nameMain = nameDataTable;
        		           
			// Return early if this element already has a plugin instance
	        if ($this.data('main')) return;
	 
	        // pass options to plugin constructor
	        var main = new MainDataTable($this, options);
	 
	 		// Inicjalizacja
			main._init();
			
	        // Store plugin object in this element's data
	        $this.data('main', main);
	                    
        });
 
    };
})(jQuery);
