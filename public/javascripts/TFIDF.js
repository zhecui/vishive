var nGrams = nGrams;

var TFIDF = {
  countTermFrequencies : function(text, options){
    var tokenLength = options ? options.tokenLength || 1 : 1;
    var nGramList =  nGrams.buildNGrams(text, tokenLength);
    return nGrams.listNGramsByCount(nGramList);
  },

  storeTermFrequencies : function(TF, TFStorage){
    TFStorage = TFStorage || {};
    for(var count in TF){
      for(var i = 0; i < TF[count].length; i++){
        var word = TF[count][i];
        if(word in TFStorage) TFStorage[word] += +count;
        else TFStorage[word] = +count;
      }
    }
    return TFStorage;
  },

  normalizeTermFrequencies : function(TF, TFStorage){
    var IDF = {};
    for(var count in TF){
      for(var i = 0; i < TF[count].length; i++){
        var word = TF[count][i];
        IDF[word] = +(count / TFStorage[word]).toFixed(4);
      }
    }

    return IDF;
  },

  identifyUniqueTerms : function(IDF, options){
    if(options && options.uniqueThreshold >= 0){
      var score = options.uniqueThreshold;
      var uniqueSet = {};
      for(var word in IDF){
        if(IDF[word] >= score){
          uniqueSet[word] = IDF[word];
        }
      }
    } else {
      var uniqueSet = [];
      var score = 0;
      for(var word in IDF){
        if(IDF[word] > score){
          uniqueSet = [word];
          score = IDF[word];
        } else if(IDF[word] === score){
          uniqueSet.push(word);
        }
      }
    }
    return uniqueSet
  },

  fullTFIDFAnalysis : function(text, options){
    options = options || {};
    var analysis = {};
    analysis.frequencyCount = this.countTermFrequencies(text, options.tokenLength);
    analysis.TFStorage = this.storeTermFrequencies(analysis.frequencyCount, options.TFStorage);
    analysis.IDF = this.normalizeTermFrequencies(analysis.frequencyCount, analysis.TFStorage);
    analysis.mostUniqueTerms = this.identifyUniqueTerms(analysis.IDF);
    return analysis;
  },
}